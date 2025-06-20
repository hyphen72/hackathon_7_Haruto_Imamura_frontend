import React, { useState, useEffect} from 'react';
import { User } from 'firebase/auth';
import { fireAuth } from './firebase';


const PostButton: React.FC = () => {
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

    const handlePostSubmit = async (e: React.FormEvent) => {
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
        const idToken = await loggedInUser.getIdToken();
        await fetch("https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                content: postContent.trim(),
            }),
            });
    } catch (err: any) {
        console.error("ポスト失敗:", err);
        setError(`ポストに失敗しました: ${err.message || '不明なエラー'}`);
    } finally {
        alert('ポストが完了しました！');
        setIsLoading(false);
        handleCloseModal();
    }
};
return (
    <>
        <button
        onClick={handleOpenModal}
        className="post-create-button"
        disabled={isLoading}
        >
        ポストする
        </button>
        {showModal && (
        <div className="modal-overlay">
            <div className="modal-content">
            <h2>新しいポストを作成</h2>
            {error && <p className="error-message">{error}</p>}
            <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="今何してる？"
                rows={6} 
                maxLength={280}
                className="post-textarea"
                disabled={isLoading}
            />

            <div className="modal-actions">
                <button
                onClick={handlePostSubmit} 
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

export default PostButton;