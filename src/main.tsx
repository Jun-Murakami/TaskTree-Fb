import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { TreeItem } from './Tree/types';
import { useAppStateSync } from './hooks/useAppStateSync';
import './index.css';
import { theme, darkTheme } from './mui_theme';
import { CssBaseline, ThemeProvider, Button, CircularProgress, Typography, Paper } from '@mui/material';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Firebaseの設定
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGE_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

initializeApp(firebaseConfig);

function Main() {
  const [darkMode, setDarkMode] = useState(false);
  const [items, setItems] = useState<TreeItem[]>([]);
  const [hideDoneItems, setHideDoneItems] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date(0));

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => {
        setIsLoggedIn(true);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        setIsLoggedIn(false);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // 状態の読み込みと保存を行うカスタムフック
  useAppStateSync(
    items,
    setItems,
    hideDoneItems,
    setHideDoneItems,
    darkMode,
    setDarkMode,
    isLoggedIn,
    setIsLoggedIn,
    setIsLoading,
    setMessage,
    lastUpdated,
    setLastUpdated
  );

  return (
    <ThemeProvider theme={darkMode ? darkTheme : theme}>
      <CssBaseline />
      {isLoggedIn ? (
        <>
          <App
            items={items}
            setItems={setItems}
            hideDoneItems={hideDoneItems}
            setHideDoneItems={setHideDoneItems}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
          {isLoading && <CircularProgress sx={{ marginTop: 2 }} />}
          <Button
            onClick={handleLogout}
            variant='outlined'
            sx={{
              zIndex: 1000,
              position: 'fixed',
              bottom: 20,
              right: 30,
              backgroundColor: theme.palette.background.default,
            }}
          >
            Logout
          </Button>
        </>
      ) : (
        <>
          <Typography sx={{ marginBottom: 4 }} variant='h3'>
            <img src='/TaskTree.svg' alt='Task Tree' style={{ width: '35px', height: '35px', marginRight: '10px' }} />
            TaskTree<Typography variant='caption'>v2</Typography>
          </Typography>

          <Button onClick={() => handleLogin()} variant={'contained'}>
            Googleでログイン
          </Button>
          {message && (
            <Typography variant='body2' sx={{ marginY: 4 }}>
              {message}
            </Typography>
          )}
          <Paper sx={{ maxWidth: 300, margin: 'auto', marginTop: 4 }}>
            <Typography variant='body2' sx={{ textAlign: 'left', p: 2 }} gutterBottom>
              2024.2.21 データの保存先をGoogle Firebaseに変更しました。
              <br />
              <br />
              このバージョンでは、ユーザーデータはGoogleのFirebaseサーバに保存されます。 データをユーザーアカウントのGoogle
              Driveに保存する旧バージョンには<a href='https://task--tree.web.app/'>こちら</a>
              からアクセスできます。
              <br />
              データを移行するには、旧バージョンでログイン後にデータをダウンロードし、 手動でアップロードを行ってください。
            </Typography>
          </Paper>
          <Typography variant='caption'>
            <a href='https://github.com/Jun-Murakami/TaskTree-Fb'>©{new Date().getFullYear()} Jun Murakami</a>
          </Typography>
        </>
      )}
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
