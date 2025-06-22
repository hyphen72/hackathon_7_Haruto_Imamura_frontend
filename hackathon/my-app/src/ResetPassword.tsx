// ResetPassword.tsx (例)
import React, { useState, useEffect } from 'react';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { app } from './firebaseConfig'; // Firebase初期化ファイル

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isValidCode, setIsValidCode] = useState(false);
    const [oobCode, setOobCode] = useState<string | null>(null);

    const auth = getAuth(app);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('oobCode');
        setOobCode(code);

        if (code) {
            verifyPasswordResetCode(auth, code)
                .then(() => {
                    setIsValidCode(true);
                })
                .catch((error) => {
                    console.error('コード検証エラー:', error);
                    setMessage('無効なリンクです、または既に期限切れです。');
                    setIsValidCode(false);
                });
        } else {
            setMessage('無効なパスワードリセットリンクです。');
        }
    }, [location.search, auth]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (newPassword !== confirmNewPassword) {
            setMessage('新しいパスワードが一致しません。');
            return;
        }

        if (!oobCode) {
            setMessage('パスワードリセットコードが見つかりません。');
            return;
        }

        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setMessage('パスワードが正常にリセットされました。');
            setTimeout(() => {
                navigate('/login'); // ログインページへリダイレクト
            }, 3000);
        } catch (error: any) {
            console.error('パスワード更新エラー:', error);
            setMessage(`パスワードの更新に失敗しました: ${error.message}`);
        }
    };

    if (!oobCode || !isValidCode) {
        return <div>{message || 'リンクを検証中です...'}</div>;
    }

    return (
        <div>
            <h2>新しいパスワードを設定</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="新しいパスワード"
                    required
                />
                <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="新しいパスワード（確認用）"
                    required
                />
                <button type="submit">パスワードをリセット</button>
            </form>
        </div>
    );
};

export default ResetPassword;