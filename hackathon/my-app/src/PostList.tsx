import React, { useState, useEffect } from 'react';
import './PostList.css'; 
import { User } from 'firebase/auth';
import { fireAuth } from './firebase';
import ReplyButton from './ReplyButton'; 
import { Link } from 'react-router-dom';
import LikeButton from './LikeButton';

interface Post {
  id: string;
  username: string;
  content: string;
  created_at: string;
  likes_count: number;
  reply_count: number;
  is_liked_by_me: boolean;
}

const timeAgo = (dateString: string): string => {
  const now = new Date();
  const past = new Date(dateString);
  const seconds = Math.round((now.getTime() - past.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) {
    return `${seconds}秒前`;
  } else if (minutes < 60) {
    return `${minutes}分前`;
  } else if (hours < 24) {
    return `${hours}時間前`;
  } else {
    return `${days}日前`;
  }
};

const PostList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);


  useEffect(() => {
  const unsubscribe = fireAuth.onAuthStateChanged((user) => {
  setLoggedInUser(user);
  });
  return () => unsubscribe();
  }, []);


  useEffect(() => {
    const fetchPosts = async () => {
      if (!loggedInUser || !loggedInUser.uid) { 
        setError('ユーザー情報が取得できませんでした。再度ログインしてください。');
        setIsLoading(false); 
        return;
      }
      try {
        const idToken = await loggedInUser.getIdToken();
        setIsLoading(true);
        setError(null);
        const response = await fetch("https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/post", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${idToken}`,
          },
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("サーバーからのエラーレスポンス（テキスト）:", response.status, errorText);
          let errorMessage = `投稿の取得に失敗しました (ステータス: ${response.status})`;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            console.warn("エラーレスポンスがJSONではありませんでした。", parseError);
          }
          throw new Error(errorMessage);
        }
        const data: Post[] = await response.json();
        setPosts(data);
      } catch (err: any) {
        console.error("投稿取得失敗:", err);
        setError(`投稿の読み込みに失敗しました: ${err.message || '不明なエラー'}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [loggedInUser]);
  const handleLikeToggle = (postId: string, newIsLiked: boolean, newLikesCount: number) => {
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === postId
                    ? { ...post, is_liked_by_me: newIsLiked, likes_count: newLikesCount }
                    : post
            )
        );
    };

  if (isLoading) {
    return (
      <div className="post-list-container">
        <p className="loading-message">投稿を読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-list-container">
        <p className="error-message">エラー: {error}</p>
        <p>再読み込みを試すか、後でもう一度お試しください。</p>
      </div>
    );
  }

  return (
    <div className="post-list-container">
      <h2>タイムライン</h2>
      {posts.length === 0 ? (
        <p>まだ投稿がありません。最初の投稿をしてみましょう！</p>
      ) : (
        <ul className="posts-feed">
          {posts.map((post) => (
            <li key={post.id} className="post-item">
              <div className="post-avatar">
                <div className="avatar-placeholder"></div>
              </div>
              <div className="post-content-wrapper">
                <Link to={`/post/${post.id}`} className="post-link-area"> 
                  <div className="post-header">
                    <span className="post-username">{post.username}</span>
                    <span className="post-timestamp">・ {timeAgo(post.created_at)}</span>
                  </div>
                  <p className="post-text">{post.content}</p>
                </Link>
                <div className="post-actions">
                  <ReplyButton postId={post.id} />
                  <span className="reply-count">
                    {post.reply_count > 0 && post.reply_count}
                  </span>
                  <button className="action-button retweet-button">
                    <span aria-label="Retweet">🔁</span>
                  </button>
                  <LikeButton
                        postId={post.id}
                        initialLikesCount={post.likes_count}
                        initialIsLikedByMe={post.is_liked_by_me}
                        onLikeToggle={handleLikeToggle}
                    />
                  <button className="action-button share-button">
                    <span aria-label="Share">📤</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PostList;