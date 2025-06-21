import React, { useState, useEffect} from 'react';
import { User } from 'firebase/auth';
import { fireAuth } from './firebase';
import {app} from './firebaseConfig'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 

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
                rows={4} 
                maxLength={280}
                className="post-textarea"
                disabled={isLoading}
            />

            <div className="image-input-section" style={{ marginTop: '15px' }}>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isLoading}
                    style={{ display: 'none' }}
                    id="image-upload-input"
                />
                <label htmlFor="image-upload-input" className="choose-image-button">
                    {selectedImageFile ? '画像を変更' : '画像を選択'}
                </label>
                {selectedImageFile && (
                    <button onClick={handleRemoveImage} className="remove-image-button" disabled={isLoading}>
                        画像を取り消し
                    </button>
                )}
                {imagePreviewUrl && (
                    <div className="image-preview-container" style={{ marginTop: '10px', textAlign: 'center' }}>
                        <img src={imagePreviewUrl} alt="投稿画像プレビュー" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', border: '1px solid #eee' }} />
                    </div>
                )}
            </div>
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