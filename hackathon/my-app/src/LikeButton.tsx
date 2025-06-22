import React, { useState, useEffect} from 'react';
import { User } from 'firebase/auth';
import { fireAuth } from './firebase';

interface LikeButtonProps {
    postId: string;
    initialLikesCount: number;
    initialIsLikedByMe: boolean;
    onLikeToggle: (postId: string, newIsLiked: boolean, newLikesCount: number) => void;
}
const LikeButton: React.FC<LikeButtonProps> = ({ postId, initialLikesCount, initialIsLikedByMe, onLikeToggle }) => {
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [isLikedByMe, setIsLikedByMe] = useState<boolean>(initialIsLikedByMe);
    const [likesCount, setLikesCount] = useState<number>(initialLikesCount);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = fireAuth.onAuthStateChanged((user) => {
            setLoggedInUser(user); 
        });
        return () => unsubscribe(); 
    }, []);
    useEffect(() => {
        setIsLikedByMe(initialIsLikedByMe);
        setLikesCount(initialLikesCount);
    }, [initialIsLikedByMe, initialLikesCount]);

    const handleLike = async () => {
        if (!loggedInUser || !loggedInUser.uid) { 
            setError('ユーザー情報が取得できませんでした。再度ログインしてください。');
            setIsLoading(false); 
            return;
        }
        const previousIsLikedByMe = isLikedByMe;
        const previousLikesCount = likesCount;

        setIsLikedByMe(!previousIsLikedByMe);
        setLikesCount(previousIsLikedByMe ? previousLikesCount - 1 : previousLikesCount + 1);

        try {
            const idToken = await loggedInUser.getIdToken();
            const method = previousIsLikedByMe ? 'DELETE' : 'POST';
            const response = await fetch("https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/likes", {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    post_id: postId
                }),
            });
            if (!response.ok) {
                setIsLikedByMe(previousIsLikedByMe);
                setLikesCount(previousLikesCount);
                const errorData = await response.json();
                throw new Error(errorData.detail || 'いいねの操作に失敗しました。');
            }
            onLikeToggle(postId, !previousIsLikedByMe, previousIsLikedByMe ? previousLikesCount - 1 : previousLikesCount + 1);
        } catch (err: any) {
            console.error("いいね操作失敗:", err);
            setError(`いいねの操作に失敗しました: ${err.message || '不明なエラー'}`);
            setIsLikedByMe(previousIsLikedByMe);
            setLikesCount(previousLikesCount);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="like-button-container">
            <button
                className={`action-button like-button ${isLikedByMe ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={isLoading}
            >
                <span aria-label="Like" style={{ color: isLikedByMe ? 'red' : 'inherit' }}>❤️</span>
                {likesCount > 0 && <span className="like-count">{likesCount}</span>}
            </button>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default LikeButton;