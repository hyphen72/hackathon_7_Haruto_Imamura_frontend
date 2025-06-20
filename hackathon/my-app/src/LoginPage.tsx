import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { fireAuth } from './firebase';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); 
        setIsLoading(true); 

        try {
            await signInWithEmailAndPassword(fireAuth, email, password);
            navigate('/');
        } catch (err: any) {
            let errorMessage = "ログイン中にエラーが発生しました。";
            switch (err.code) {
                case "auth/invalid-email":
                    errorMessage = "無効なメールアドレス形式です。";
                    break;
                case "auth/user-disabled":
                    errorMessage = "このアカウントは無効化されています。";
                    break;
                case "auth/user-not-found":
                    errorMessage = "メールアドレスまたはパスワードが正しくありません。";
                    break;
                case "auth/wrong-password":
                    errorMessage = "メールアドレスまたはパスワードが正しくありません。";
                    break;
                case "auth/too-many-requests":
                    errorMessage = "複数回の試行によりアカウントが一時的にロックされました。しばらくしてからお試しください。";
                    break;
                default:
                    errorMessage = err.message; 
            }
            setError(errorMessage);
            console.error('ログインエラー:', err);
        } finally {
            setIsLoading(false); 
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">ログイン</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            メールアドレス:
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="メールアドレス"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            パスワード:
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="******"
                        />
                    </div>
                    {error && (
                        <p className="text-red-600 text-sm text-center">
                            {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                            isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        }`}
                    >
                        {isLoading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        アカウントをお持ちでないですか？{' '}
                        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                            今すぐ登録
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;