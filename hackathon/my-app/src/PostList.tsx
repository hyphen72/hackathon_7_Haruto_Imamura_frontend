import React, { useState, useEffect, useCallback } from 'react';
import './PostList.css'; 
import { User } from 'firebase/auth';
import { fireAuth } from './firebase';
import ReplyButton from './ReplyButton'; 
import { Link } from 'react-router-dom';
import LikeButton from './LikeButton';
interface NullString {
  String: string;
  Valid: boolean;
}
interface PostListProps {
  searchKeyword: string;
}
interface Post {
  id: string;
  username: string;
  content: string;
  created_at: string;
  likes_count: number;
  reply_count: number;
  is_liked_by_me: boolean;
  profile_image_url?: NullString;
  image_url?: NullString;
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

const DEFAULT_PROFILE_IMAGE_URL = 'https://firebasestorage.googleapis.com/v0/b/term7-haruto-imamura.firebasestorage.app/o/default_user.png?alt=media&token=a157c0ae-250b-4f51-9b0f-e10e31174f7e'

const PostList: React.FC<PostListProps> = ({searchKeyword}) => {
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

  const fetchPosts = useCallback(async () => {
    if (!loggedInUser || !loggedInUser.uid) { 
      setError('ユーザー情報が取得できませんでした。再度ログインしてください。');
      setIsLoading(false); 
      return;
    }
    try {
      const url = new URL("https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/post");
      if (searchKeyword.trim() !== '') {
        url.searchParams.append('q', searchKeyword.trim());
      }
      const idToken = await loggedInUser.getIdToken();
      setIsLoading(true);
      setError(null);
      const response = await fetch(url.toString(), {
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
  }, [loggedInUser, searchKeyword]);
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
      {posts.length === 0 && searchKeyword.trim() !== '' ? (
        <p>「{searchKeyword}」に一致する投稿は見つかりませんでした。</p>
      ) : posts.length === 0 ? (
        <p>まだ投稿がありません。最初の投稿をしてみましょう！</p>
      ) : (
        <ul className="posts-feed">
          {posts.map((post) => (
            <li key={post.id} className="post-item">
              <div className="post-avatar">
                <img
                  src={
                    (post.profile_image_url?.Valid && post.profile_image_url.String)
                      ? post.profile_image_url.String
                      : DEFAULT_PROFILE_IMAGE_URL
                  }
                  alt={`${post.username}のプロフィール画像`}
                  className="avatar-image"
                />
              </div>
              <div className="post-content-wrapper">
                <Link to={`/post/${post.id}`} className="post-link-area"style={{ textDecoration: 'none'}}> 
                  <div className="post-header">
                    <span className="post-username">{post.username}</span>
                    <span className="post-timestamp">・ {timeAgo(post.created_at)}</span>
                  </div>
                  <p className="post-text">{post.content}</p>
                  {post.image_url?.Valid && post.image_url.String && (
                    <div className="post-image-container">
                      <img
                        src={post.image_url.String}
                        alt={`${post.username}の投稿画像`}
                        className="post-image"
                      />
                    </div>
                  )}
                </Link>
                <div className="post-actions">
                  <ReplyButton postId={post.id} />
                  <span className="reply-count">
                    {post.reply_count > 0 && post.reply_count}
                  </span>
                  <LikeButton
                        postId={post.id}
                        initialLikesCount={post.likes_count}
                        initialIsLikedByMe={post.is_liked_by_me}
                        onLikeToggle={handleLikeToggle}
                    />
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