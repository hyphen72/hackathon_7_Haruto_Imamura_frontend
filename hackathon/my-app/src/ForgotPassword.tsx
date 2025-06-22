// ForgotPassword.tsx (例)
import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from './firebaseConfig';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const auth = getAuth(app);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        console.log("Attempting to send password reset email to:", email);
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('パスワードリセットのメールを送信しました。メールをご確認ください。');
        } catch (error: any) {
            console.error('パスワードリセットエラー:', error);
            setMessage(`エラーが発生しました: ${error.message}`);
        }
    };

    return (
        <div>
            <h2>パスワードをリセット</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="登録済みのメールアドレス"
                    required
                />
                <button type="submit">パスワードリセットメールを送信</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default ForgotPassword;