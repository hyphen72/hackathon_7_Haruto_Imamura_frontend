// App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from "firebase/auth"; 
import { fireAuth } from "./firebase";
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import PostDetailPage from './PostDetailPage';
import ProfileSettings from './ProfileSetting';
import ForgotPassword from './ForgotPassword'; 
import ResetPassword from './ResetPassword';

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
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
          <Route path="/post/:postId" element={<PostDetailPage />} />
          <Route path="/settings/profile" element={isAuthenticated ? <ProfileSettings /> : <Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<h2>ページが見つかりません (404)</h2>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
