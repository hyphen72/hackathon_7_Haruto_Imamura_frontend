import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import PostButton from './PostButton';
import PostList from './PostList';
import './HomePage.css';
import { app } from './firebaseConfig';
const auth = getAuth(app);
interface NullString {
    String: string;
    Valid: boolean;
}
interface UserProfileData {
    username: string;
    profile_image_url?: NullString;
}

const HomePage: React.FC = () => {
    const [loginUser, setLoginUser] = useState(auth.currentUser);
    const navigate = useNavigate();
    const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);
    const DEFAULT_PROFILE_IMAGE_URL = 'https://firebasestorage.googleapis.com/v0/b/term7-haruto-imamura.firebasestorage.app/o/default_user.png?alt=media&token=a157c0ae-250b-4f51-9b0f-e10e31174f7e';

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            setLoginUser(user);
            if (user) {
                // ユーザーがログインしたらプロフィールデータをフェッチ
                fetchUserProfile(user);
            } else {
                setUserProfileData(null); // ログアウトしたらプロフィールデータをクリア
                setIsProfileLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchUserProfile = async (user: typeof auth.currentUser) => {
        if (!user) return;

        setIsProfileLoading(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/user`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`ユーザー情報の取得に失敗しました: ${response.status} - ${errorBody}`);
            }

            const data: UserProfileData = await response.json();
            setUserProfileData(data);
        } catch (error) {
            console.error('ユーザープロフィール取得エラー:', error);
            setUserProfileData(null); 
        } finally {
            setIsProfileLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("ログアウトエラー:", error);
        }
    };
    const displayProfileImageUrl = userProfileData?.profile_image_url?.Valid && userProfileData.profile_image_url.String
        ? userProfileData.profile_image_url.String
        : DEFAULT_PROFILE_IMAGE_URL;
    const displayUsername = userProfileData?.username || (loginUser ? loginUser.email : 'ゲスト');
    return (
        <div className="layout-container">
            <nav className="left-sidebar">
                <div className="sidebar-header">
                    <Link to="/" className="logo-link">X</Link> 
                </div>
                <ul className="sidebar-nav-links">
                    <li><Link to="/" className="nav-link">ホーム</Link></li>
                    {/* <li><Link to="/explore" className="nav-link">話題を検索</Link></li> */}
                    {/* <li><Link to="/notifications" className="nav-link">通知</Link></li> */}
                    {/* <li><Link to="/messages" className="nav-link">メッセージ</Link></li> */}
                    <li><Link to={`/profile/${loginUser?.uid || 'guest'}`} className="nav-link">プロフィール</Link></li>
                    {/* プロフィール設定ページへのリンク */}
                    <li><Link to="/settings/profile" className="nav-link">プロフィール設定</Link></li>
                    {/* <li><Link to="/more" className="nav-link">もっと見る</Link></li> */}
                </ul>
                
                {isProfileLoading ? (
                    <div className="sidebar-user-section">
                        <p>プロフィール読み込み中...</p>
                    </div>
                ) : loginUser ? (
                    <div className="sidebar-user-section">
                        <div className="user-info">
                            <img src={displayProfileImageUrl} alt="User Avatar" className="user-avatar-small" />
                            <span className="user-display-name">{displayUsername}</span>
                        </div>
                        <button onClick={handleLogout} className="logout-button">ログアウト</button>
                    </div>
                ) : (
                    <div className="sidebar-auth-buttons">
                        <Link to="/login" className="login-button">ログイン</Link>
                        <Link to="/register" className="register-button">新規登録</Link>
                    </div>
                )}
            </nav>

            <main className="main-content-area">
                <div className="timeline-header">
                    <h2>最新の投稿</h2>
                </div>
                <PostList />
            </main>
            <aside className="right-sidebar">
                <div className="search-bar">
                    <input type="text" placeholder="キーワード検索" />
                </div>
            </aside>

            {loginUser && (
                <div className="floating-post-button-container">
                    <PostButton />
                </div>
            )}
        </div>
    );
};

export default HomePage;