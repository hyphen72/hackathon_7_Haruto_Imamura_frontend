// App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from "firebase/auth"; 
import { fireAuth } from "./firebase";
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import PostDetailPage from './PostDetailPage';

const LoadingSpinner: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '24px',
    color: '#333'
  }}>
    ロード中...
  </div>
);

function App() {
  const [loginUser, setLoginUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
      setLoginUser(user); 
    });
    return () => unsubscribe();
  }, []);
  if (loginUser === undefined) {
    return <LoadingSpinner />;
  }
  const isAuthenticated = loginUser !== null;

  return (
    <BrowserRouter>
      <nav style={{ padding: '20px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: '20px' }}>
          {!isAuthenticated && (
            <>
              <li>
                <Link to="/login" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
                  ログイン
                </Link>
              </li>
              <li>
                <Link to="/register" style={{ textDecoration: 'none', color: '#28a745', fontWeight: 'bold' }}>
                  新規登録
                </Link>
              </li>
            </>
          )}
          {isAuthenticated && (
            <li>
              <Link to="/" style={{ textDecoration: 'none', color: '#6f42c1', fontWeight: 'bold' }}>
                ホーム
              </Link>
            </li>
          )}
          {isAuthenticated && (
            <li>
              <button
                onClick={() => fireAuth.signOut()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1em',
                  padding: 0,
                }}
              >
                ログアウト
              </button>
            </li>
          )}
        </ul>
      </nav>

      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
          <Route path="/post/:postId" element={<PostDetailPage />} />
          <Route path="*" element={<h2>ページが見つかりません (404)</h2>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
