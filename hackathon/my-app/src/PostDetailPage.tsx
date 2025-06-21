import React, { useState, useEffect,useCallback } from 'react';
import { useParams } from 'react-router-dom'; 
import ReplyButton from './ReplyButton';
import LikeButton from './LikeButton';
import { User } from 'firebase/auth'; 
import { fireAuth } from './firebase'; 
import { useNavigate, Link } from 'react-router-dom';
interface NullString {
    String: string;
    Valid: boolean;
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
const DEFAULT_PROFILE_IMAGE_URL = 'https://firebasestorage.googleapis.com/v0/b/term7-haruto-imamura.firebasestorage.app/o/default_user.png?alt=media&token=a157c0ae-250b-4f51-9b0f-e10e31174f7e'

const PostDetailPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [replies, setReplies] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null); 
    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate(-1);
    };
    const handleGoToList = () => {
        navigate('/');
    };

    useEffect(() => {
        const unsubscribe = fireAuth.onAuthStateChanged((user) => {
            setLoggedInUser(user);
        });
        return () => unsubscribe();
    }, []);

    const fetchPostAndReplies = useCallback (async () => {
        if (!loggedInUser || !loggedInUser.uid) {
            setError('ユーザー情報が取得できませんでした。再度ログインしてください。');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const idToken = await loggedInUser.getIdToken();
            const postResponse = await fetch(`https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/post_detail/${postId}`, {
                headers: { "Authorization": `Bearer ${idToken}` } 
            });
            if (!postResponse.ok) {
                throw new Error('投稿詳細の取得に失敗しました。');
            }
            const postData: Post = await postResponse.json();
            setPost(postData);
            console.log(postData)
            const repliesResponse = await fetch(`https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/replies/${postId}`, {
                headers: { "Authorization": `Bearer ${idToken}` } 
            });
            if (!repliesResponse.ok) {
                throw new Error('リプライの取得に失敗しました。');
            }
            const repliesData: Post[] = await repliesResponse.json();
            setReplies(repliesData);
        } catch (err: any) {
            console.error("データの取得に失敗しました:", err);
            setError(`データの読み込み中にエラーが発生しました: ${err.message || '不明なエラー'}`);
        } finally {
            setLoading(false);
        }
    }, [postId, loggedInUser]);
    useEffect(() => {
        if (loggedInUser) { 
            fetchPostAndReplies();
        }
    }, [loggedInUser, fetchPostAndReplies]); 
    const handleLikeToggle = (targetId: string, newIsLiked: boolean, newLikesCount: number) => {
        setPost(prevPost => {
            if (prevPost && prevPost.id === targetId) {
                return { ...prevPost, is_liked_by_me: newIsLiked, likes_count: newLikesCount };
            }
            return prevPost;
        });
        setReplies(prevReplies =>
            prevReplies.map(reply =>
                reply.id === targetId
                    ? { ...reply, is_liked_by_me: newIsLiked, likes_count: newLikesCount }
                    : reply
            )
        );
    };
    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds}秒前`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}分前`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}時間前`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}日前`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return <div className="loading-message">読み込み中...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!post) {
        return <div className="not-found-message">投稿が見つかりませんでした。</div>;
    }


return (
        <div className="post-detail-page">
            <div className="original-post-section">
                <h2>投稿詳細</h2>
                <button onClick={handleGoBack}>前のページに戻る</button>
                <button onClick={handleGoToList}>投稿一覧へ</button>
                <div className="post-item">
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
                        <div className="post-actions">
                            <ReplyButton
                                postId={post.id}
                            />
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
                </div>
            </div>

            ---

            <div className="replies-section">
                <h2>リプライ ({replies.length})</h2>
                {replies.length === 0 ? (
                    <p>まだリプライがありません。</p>
                ) : (
                    <ul className="replies-feed">
                        {replies.map((reply) => (
                            <li key={reply.id} className="reply-item post-item">
                                <div className="post-avatar">
                                    <img
                                        src={
                                            (reply.profile_image_url?.Valid && reply.profile_image_url.String)
                                                ? reply.profile_image_url.String
                                                : DEFAULT_PROFILE_IMAGE_URL
                                            }
                                        alt={`${reply.username}のプロフィール画像`}
                                        className="avatar-image"
                                    />
                                </div>
                                <div className="post-content-wrapper">
                                    <Link to={`/post/${reply.id}`} className="post-link-area"style={{ textDecoration: 'none'}}> 
                                        <div className="post-header">
                                            <span className="post-username">{reply.username}</span>
                                            <span className="post-timestamp">・ {timeAgo(reply.created_at)}</span>
                                        </div>
                                        <p className="post-text">{reply.content}</p>
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
                                        <ReplyButton
                                            postId={reply.id} 
                                        />
                                        <span className="reply-count">
                                            {reply.reply_count > 0 && reply.reply_count}
                                        </span>
                                        <LikeButton
                                            postId={reply.id}
                                            initialLikesCount={reply.likes_count}
                                            initialIsLikedByMe={reply.is_liked_by_me}
                                            onLikeToggle={handleLikeToggle}
                                        />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default PostDetailPage;