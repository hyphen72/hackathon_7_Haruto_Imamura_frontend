import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, User,} from 'firebase/auth'; 
import React, { useState, } from 'react';
import { fireAuth } from './firebase';
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); 
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfileImageFile(e.target.files[0]);
        }
    };
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); 
        setIsLoading(true);
        setSuccessMessage(null);

        if (password !== confirmPassword) {
            setError('パスワードと確認用パスワードが一致しません。');
            setIsLoading(false);
            return;
        }
        let firebaseUser: User | null = null;
        let imageUrl: string | null = null;

        try {
            const userfirebase = await createUserWithEmailAndPassword(fireAuth, email, password);
            firebaseUser = userfirebase.user;
            if (!firebaseUser) {
                throw new Error("Firebase ユーザーオブジェクトの取得に失敗しました。");
            }
            console.log("Firebaseアカウント作成成功、ユーザーUID:", firebaseUser.uid);
            if (profileImageFile) {
                const storageRef = ref(storage, `users/${firebaseUser.uid}/profile.jpg`);
                const snapshot = await uploadBytes(storageRef, profileImageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
                setProfileImageUrl(imageUrl); 
            }
            console.log("IDトークン取得開始...");
            const idToken = await firebaseUser.getIdToken();
            console.log("バックエンドへのPOSTリクエスト送信開始...");
            const result = await fetch("https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    username: user, 
                    profileImageUrl: imageUrl,
                }),
            });
            if (!result.ok) {
                throw Error(`Failed to create user: ${result.status}`);
            }     
            setSuccessMessage("サインアップに成功しました");
        } catch (err: any) { 
            const errorMessage = err.message;
            setError(`サインアップ失敗: ${errorMessage}`);
        } finally{
            setIsLoading(false)
        }
    };
    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>新規登録</h2>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
                <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>メールアドレス:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                    placeholder="メールアドレスを入力"
                />
            </div>
            <div>
                <label htmlFor="user" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>ユーザーID:</label>
                <input
                    type="user"
                    id="user"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                    placeholder="ユーザーIDを入力"
                />
            </div>
            <div>
                <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>パスワード:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                    placeholder="パスワードを入力"
                />
            </div>
            <div>
                <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>パスワード（確認）:</label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                    placeholder="パスワードを再入力"
                />
            </div>
            <hr style={{ margin: '10px 0', borderColor: '#eee' }} />
                <h3 style={{ textAlign: 'center', marginBottom: '10px', color: '#333', fontSize: '1.2em' }}>プロフィール写真（任意）</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                    {profileImageUrl && (
                        <img
                            src={profileImageUrl}
                            alt="プロフィール画像プレビュー"
                            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }}
                        />
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        style={{ display: 'block' }}
                    />
                </div>
                <hr style={{ margin: '10px 0', borderColor: '#eee' }} />
            {error && (
                <p style={{ color: 'red', fontSize: '0.9em', textAlign: 'center' }}>
                {error}
                </p>
            )}
            <button
                type="submit"
                disabled={isLoading}
                style={{
                padding: '12px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'background-color 0.3s ease',
                opacity: isLoading ? 0.7 : 1,
                }}
            >
                {isLoading ? '登録中...' : '登録'}
            </button>
            {successMessage && <p>{successMessage}</p>}
            {error && <p>{error}</p>}
            </form>
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#555' }}>
            すでにアカウントをお持ちですか？{' '}
            <Link to="/login" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>
                ログイン
            </Link>
            </p>
        </div>
    );
};

export default RegisterPage;