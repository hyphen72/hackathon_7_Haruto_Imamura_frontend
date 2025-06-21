import React, { useState, useEffect} from 'react';
import { User } from 'firebase/auth';
import { fireAuth } from './firebase';
import {app} from './firebaseConfig'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import './PostButton.css'; 

const PostButton: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null); // 追加: 選択された画像ファイル
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // 追加: 画像プレビューURL
    const storage = getStorage(app);

    useEffect(() => {
    const unsubscribe = fireAuth.onAuthStateChanged((user) => {
        setLoggedInUser(user); 
    });
    return () => unsubscribe(); 
    }, []);

    const handleOpenModal = () => {
    setShowModal(true);
    setError(null);
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    };

    const handleCloseModal = () => {
    setShowModal(false);
    setPostContent(''); 
    setError(null); 
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setSelectedImageFile(null);
            setImagePreviewUrl(null);
        }
    };
    const handleRemoveImage = () => {
        setSelectedImageFile(null);
        setImagePreviewUrl(null);
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

        let imageUrl: string | null = null;

        try{
            if (selectedImageFile) {
                const fileName = `${loggedInUser.uid}/${Date.now()}_${selectedImageFile.name}`;
                const storageRef = ref(storage, `posts/${fileName}`); 
                await uploadBytes(storageRef, selectedImageFile);
                imageUrl = await getDownloadURL(storageRef);
            }
            const idToken = await loggedInUser.getIdToken();
            await fetch("https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/post", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    content: postContent.trim(),
                    imageUrl: imageUrl,
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
                className="post-create-main-button"
                disabled={isLoading}
            >
                <svg className="post-create-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                ポストする
            </button>
            {showModal && (
                <div className="post-modal-overlay">
                    <div className="post-modal-content">
                        <h2 className="post-modal-title">新しいポストを作成</h2>
                        {error && <p className="post-error-message">{error}</p>}
                        <textarea
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            placeholder="今何してる？"
                            rows={5}
                            maxLength={280}
                            className="post-modal-textarea"
                            disabled={isLoading}
                        />
                        <div className="post-image-input-section">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={isLoading}
                                className="hidden-file-input"
                                id="image-upload-input"
                            />
                            <label
                                htmlFor="image-upload-input"
                                className="post-choose-image-button"
                            >
                                <svg className="post-image-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-4 4 4 4-4V5h-2a1 1 0 100 2h2v6zm-4-8a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                                </svg>
                                {selectedImageFile ? '画像を変更' : '画像を選択'}
                            </label>
                            {selectedImageFile && (
                                <button
                                    onClick={handleRemoveImage}
                                    className="post-remove-image-button"
                                    disabled={isLoading}
                                >
                                    画像を取り消し
                                </button>
                            )}
                            {imagePreviewUrl && (
                                <div className="post-image-preview-container">
                                    <img src={imagePreviewUrl} alt="投稿画像プレビュー" className="post-image-preview" />
                                </div>
                            )}
                        </div>
                        <div className="post-modal-actions">
                            <button
                                onClick={handleCloseModal}
                                className="post-cancel-button"
                                disabled={isLoading}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handlePostSubmit}
                                className={`post-submit-button ${isLoading || (postContent.trim() === '' && !selectedImageFile) ? 'post-button-disabled' : ''}`}
                                disabled={isLoading || (postContent.trim() === '' && !selectedImageFile)}
                            >
                                {isLoading ? '投稿中...' : '投稿'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};


export default PostButton;