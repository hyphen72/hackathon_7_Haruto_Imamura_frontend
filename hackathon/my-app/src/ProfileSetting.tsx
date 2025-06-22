import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './ProfileSetting.css';
import { Link } from 'react-router-dom';
import { app } from './firebaseConfig';
interface NullString {
    String: string;
    Valid: boolean;
}

interface UserProfile {
    username: string;
    profile_image_url?: NullString; 
}

const ProfileSettings: React.FC = () => {
    const auth = getAuth(app);
    const storage = getStorage(app);
    const currentUser = auth.currentUser;
    const [username, setUsername] = useState<string>('');
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [currentProfileImageUrl, setCurrentProfileImageUrl] = useState<string>('https://firebasestorage.googleapis.com/v0/b/term7-haruto-imamura.firebasestorage.app/o/default_user.png?alt=media&token=a157c0ae-250b-4f51-9b0f-e10e31174f7e');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const DEFAULT_PROFILE_IMAGE_URL = 'https://firebasestorage.googleapis.com/v0/b/term7-haruto-imamura.firebasestorage.app/o/default_user.png?alt=media&token=a157c0ae-250b-4f51-9b0f-e10e31174f7e';

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!currentUser) {
                setMessage('ログインしていません。');
                return;
            }
            setIsLoading(true);
            setMessage(null);
        try {
            const idToken = await currentUser.getIdToken();
            const response = await fetch(`https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/user`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`ユーザー情報の取得に失敗しました: ${response.status}`);
            }
            const data: UserProfile = await response.json();
            setUsername(data.username);
            if (data.profile_image_url?.Valid && data.profile_image_url.String) {
                setCurrentProfileImageUrl(data.profile_image_url.String);
            } else {
                setCurrentProfileImageUrl(DEFAULT_PROFILE_IMAGE_URL);
            }
        } catch (error: any) {
            console.error('ユーザー情報の取得エラー:', error);
            setMessage(`ユーザー情報の取得に失敗しました: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    fetchUserProfile();
    }, [currentUser]); 

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCurrentProfileImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setProfileImageFile(null);
            if (!currentProfileImageUrl.startsWith('data:')) { 
                setCurrentProfileImageUrl(DEFAULT_PROFILE_IMAGE_URL);
            }
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            setMessage('ログインしていません。');
            return;
        }
        setIsLoading(true);
        setMessage(null);
        let newProfileImageUrl: string | null = null;
        try {
            if (profileImageFile) {
                const storageRef = ref(storage, `users/${currentUser.uid}/profile.jpg`);
                const snapshot = await uploadBytes(storageRef, profileImageFile);
                newProfileImageUrl = await getDownloadURL(snapshot.ref);
                console.log('プロフィール画像がアップロードされました:', newProfileImageUrl);
            } else {
                newProfileImageUrl = currentProfileImageUrl.startsWith('http') ? currentProfileImageUrl : null;
            }
            const idToken = await currentUser.getIdToken();
            const response = await fetch(`https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/user`, {
                method: 'PUT', 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    username: username,
                    profileImageUrl: newProfileImageUrl,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`プロフィールの更新に失敗しました: ${response.status} - ${errorBody}`);
            }
            setMessage('プロフィールが正常に更新されました！');
            if (newProfileImageUrl) {
                setCurrentProfileImageUrl(newProfileImageUrl);
            } else if (!profileImageFile) {
                setCurrentProfileImageUrl(DEFAULT_PROFILE_IMAGE_URL);
            }
        } catch (error: any) {
            console.error('プロフィールの更新エラー:', error);
            setMessage(`プロフィールの更新に失敗しました: ${error.message}`);
        } finally {
            setIsLoading(false);
            setProfileImageFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (isLoading && !message) {
        return <div>読み込み中...</div>;
    }

    if (!currentUser) {
        return <div>プロフィールを編集するにはログインが必要です。</div>;
    }
    return (
        <div className="profile-settings-container">
            <Link to="/" className="back-to-home-button">← ホームに戻る</Link>
            <h1>プロフィール設定</h1>
                {message && <p className={`message ${message.includes('失敗') ? 'error' : 'success'}`}>{message}</p>}

            <form onSubmit={handleSubmit}>
                <div className="form-group profile-image-preview">
                <label>プロフィール写真</label>
                <img
                    src={currentProfileImageUrl}
                    alt="プロフィールプレビュー"
                    className="profile-preview-image"
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                写真を選択
            </button>
            {profileImageFile && (
            <button type="button" onClick={() => {
                setProfileImageFile(null);
                setCurrentProfileImageUrl(DEFAULT_PROFILE_IMAGE_URL);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }} disabled={isLoading}>
                選択解除
            </button>
            )}
        </div>

            <div className="form-group">
                <label htmlFor="username">ユーザー名</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>

                <button type="submit" disabled={isLoading}>
                    {isLoading ? '保存中...' : '変更を保存'}
                </button>
            </form>
        </div>
    );
};

export default ProfileSettings;