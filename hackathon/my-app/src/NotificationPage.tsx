import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged,} from "firebase/auth";
import { app } from './firebaseConfig';
const auth = getAuth(app);
interface Notification {
    id: string;
    postId: string;
    postContent: string;
    sourceUserId: string;
    sourceUsername: string;
    isRead: boolean;
    createdAt: string;
    notificationType: string;
}
export const generateNotificationMessage = (notification: Notification): string => {
    const sourceUsername = notification.sourceUsername;
    let postContentText: string;
    if (
        typeof notification.postContent === 'object' &&
        notification.postContent !== null &&
        'String' in notification.postContent &&
        typeof (notification.postContent as { String: string }).String === 'string'
    ) {
        postContentText = (notification.postContent as { String: string }).String;
    } else if (notification.postContent === null) {
        postContentText = '';
    } else {
        postContentText = notification.postContent;
    }

    switch (notification.notificationType) {
        case 'like':
            return `${sourceUsername} さんがあなたの投稿にいいねしました。`;
        case 'reply':
            return `${sourceUsername} さんがあなたの投稿にリプライしました。`;
        case 'warn':
            return `あなたの投稿:${postContentText}において不適切な発言が見られました公序良俗に反する投稿はお控えください`;
        case 'delete':
            return `あなたの投稿：${postContentText}はガイドライン違反のため削除されました。詳細をご確認ください。`
        default:
            return `新しい通知があります: ${notification.notificationType}`;
    }
};

const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loginUser, setLoginUser] = useState(auth.currentUser);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, user => {
                setLoginUser(user);
                if (user) {
                    fetchNotifications(user);
                }
            });
            return () => unsubscribe();
    }, []);
    const fetchNotifications = async (user: typeof auth.currentUser) => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch('https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/notifications', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                }
            });        
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '通知リストの取得に失敗しました');
            }
            const receivedData: unknown = await response.json();
            console.log(receivedData)
            let processedNotifications: Notification[] = [];
            if (Array.isArray(receivedData)) {
                if (receivedData.every((item: any) =>
                    typeof item === 'object' && item !== null && 'id' in item && 'notificationType' in item
                )) {
                    processedNotifications = receivedData as Notification[];
                } else {
                    console.warn("APIから返された配列に不正な形式の要素が含まれています:", receivedData);
                    setError('通知データに不正な形式の要素が含まれています。');
                }
            } else if (typeof receivedData === 'object' && receivedData !== null && 'id' in receivedData && 'notificationType' in receivedData) {
                const singleNotification = receivedData as Notification;
                const isEffectivelyEmpty = 
                    (singleNotification.id === "" || singleNotification.id === undefined || singleNotification.id === null) &&
                    (singleNotification.postId === "" || singleNotification.postId === undefined || singleNotification.postId === null) &&
                    (singleNotification.sourceUserId === "" || singleNotification.sourceUserId === undefined || singleNotification.sourceUserId === null) &&
                    (singleNotification.notificationType === "" || singleNotification.notificationType === undefined || singleNotification.notificationType === null);
            if (isEffectivelyEmpty) {
                processedNotifications = [];
            } else {
                processedNotifications = [singleNotification];
            }
            } else {
                console.error("APIから返されたデータが期待されるNotification[]形式ではありません:", receivedData);
                setError('通知データの形式が不正です。');
            }
            setNotifications(processedNotifications);
        } catch (err: any) {
            console.error("通知リストの取得エラー:", err);
            setError(err.message || '通知の読み込み中にエラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };
    const markAsRead = async (user: typeof auth.currentUser, notificationId: string) => {
        if (!user) return;
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`https://hackathon-7-haruto-imamura-backend-212382913943.us-central1.run.app/notifications/${notificationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '通知の既読化に失敗しました');
            }
            setNotifications(prev =>
                prev.map(notif => (notif.id === notificationId ? { ...notif, isRead: true } : notif))
            );
        } catch (err) {
            console.error("既読化エラー:", err);
        }
    };
    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await markAsRead(loginUser,notification.id);
        }
        navigate(`/post/${notification.postId}`);
    };

    return (
        <div className="notifications-page-container">
            <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>前のページに戻る</button>
            <h2>通知</h2>
            {loading && <p>通知を読み込み中...</p>}
            {error && <p className="error-message">エラー: {error}</p>}
            {!loading && !error && notifications.length === 0 && (
                <p>新しい通知はありません。</p>
            )}
            {!loading && !error && notifications.length > 0 && (
                <ul className="notification-list">
                    {notifications.map(notification => (
                        <li
                            key={notification.id}
                            className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <p className="notification-message">{generateNotificationMessage(notification)}</p>
                            <span className="notification-timestamp">{new Date(notification.createdAt).toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default NotificationsPage;