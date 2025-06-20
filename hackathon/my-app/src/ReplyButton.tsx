import React, { useState, useEffect} from 'react';
import { User } from 'firebase/auth';
import { fireAuth } from './firebase';

interface ReplyButtonProps {
    postId: string;
}

const ReplyButton: React.FC<ReplyButtonProps> = ({postId}) => {
    const [showModal, setShowModal] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

    useEffect(() => {
    const unsubscribe = fireAuth.onAuthStateChanged((user) => {
        setLoggedInUser(user); 
    });
    return () => unsubscribe(); 
    }, []);

    const handleOpenModal = () => {
    setShowModal(true);
    setError(null);
    };

    const handleCloseModal = () => {
    setShowModal(false);
    setPostContent(''); 
    setError(null); 
    };

    const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); 
    if (!loggedInUser || !loggedInUser.uid) { 
        setError('ユーザー情報が取得できませんでした。再度ログインしてください。');
        setIsLoading(false); 
        return;
    }
    if (postContent.trim() === '') {
        alert('投稿内容を入力してください。');
        return;
    }
    if (isLoading) return;
    setIsLoading(true);
    try{ 
        console.log("postId:", postId);
        const idToken = await loggedInUser.getIdToken();
        await fetch("https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                reply_id: postId,
                content: postContent.trim(),
            }),
            });
    } catch (err: any) {
        console.error("リプライ失敗:", err);
        setError(`リプライに失敗しました: ${err.message || '不明なエラー'}`);
    } finally {
        alert('リプライが完了しました！'); 
        setIsLoading(false);
        handleCloseModal();
    }
};
return (
    <>
        <button className="action-button reply-button" onClick={handleOpenModal}>
            <span aria-label="Reply">💬</span>
        </button>
        {showModal && (
        <div className="modal-overlay">
            <div className="modal-content">
            <h2>リプライを行う</h2>

            {error && <p className="error-message">{error}</p>}

            <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="リプライ内容を入力"
                rows={6} 
                maxLength={280} 
                className="post-textarea"
                disabled={isLoading}
            />

            <div className="modal-actions">
                <button
                onClick={handleReplySubmit} 
                className="submit-post-button"
                disabled={isLoading || (postContent.trim() === '')}
                >
                {isLoading ? '投稿中...' : '投稿'}
                </button>
                <button
                onClick={handleCloseModal}
                className="cancel-post-button"
                disabled={isLoading}
                >
                キャンセル
                </button>
            </div>
            </div>
        </div>
        )}
    </>
    );
};

export default ReplyButton;