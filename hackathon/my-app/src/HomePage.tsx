// src/pages/HomePage.tsx

import { Link } from 'react-router-dom'; 
import { onAuthStateChanged } from "firebase/auth";
import { fireAuth } from "./firebase";
import React, { useState } from 'react';
import PostButton from './PostButton'; 
import PostList from './PostList';     

const HomePage: React.FC = () => {
    const [loginUser, setLoginUser] = useState(fireAuth.currentUser);

    onAuthStateChanged(fireAuth, user => {
        setLoginUser(user);
    });
    return (
        <div className="home-page-container">
            <header className="home-page-header">
                <h1>ホーム</h1>
                <p>ようこそ！</p> 
                {!loginUser ?(
                    <nav>
                        <Link to="/login" style={{ marginRight: '10px' }}>ログイン</Link>
                        <Link to="/register">新規登録</Link>
                    </nav>
                ):(
                    <div></div>
                )}
            </header>

            <main className="home-page-main-content">
                <div className="posts-feed">
                    <PostList /> 
                </div>

                <div className="post-button-fixed-container">
                    <PostButton /> 
                </div>
            </main>
        </div>
    );
};

export default HomePage;