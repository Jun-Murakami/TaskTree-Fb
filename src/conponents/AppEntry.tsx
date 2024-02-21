import { useState, useEffect } from 'react';
import AppMain from './AppMain';
import { TreeItem } from './Tree/types.ts';
import { useAppStateSync } from '../hooks/useAppStateSync';
import { theme, darkTheme } from './mui_theme';
import { CssBaseline, ThemeProvider, Button, CircularProgress, Typography, Paper } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getDatabase, remove, ref } from 'firebase/database';

export default function AppEntry() {
  const [darkMode, setDarkMode] = useState(false);
  const [items, setItems] = useState<TreeItem[]>([]);
  const [hideDoneItems, setHideDoneItems] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isWaitingForDelete, setIsWaitingForDelete] = useState(false);

  // ログイン状態の監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Googleログイン
  const handleLogin = () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => {
        setIsLoggedIn(true);
        setMessage(null);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // ログアウト
  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        setIsLoggedIn(false);
        if (!isWaitingForDelete) setMessage('ログアウトしました。');
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
    setMessage
  );

  // アカウント削除
  const handleDeleteAccount = () => {
    const user = getAuth().currentUser;
    if (user) {
      const db = getDatabase();
      const appStateRef = ref(db, `users/${user.uid}/appState`);
      remove(appStateRef)
        .then(() => {
          console.log('データが正常に削除されました。');
        })
        .catch((error) => {
          console.error('データの削除中にエラーが発生しました:', error);
        });
      user
        .delete()
        .then(() => {
          handleLogout();
          setMessage('アカウントが削除されました。');
        })
        .catch((error) => {
          if (error instanceof Error) {
            setMessage('アカウントの削除中にエラーが発生しました。管理者に連絡してください。 : ' + error.message);
          } else {
            setMessage('アカウントの削除中にエラーが発生しました。管理者に連絡してください。 : 不明なエラー');
          }
          handleLogout();
        });
    } else {
      setMessage('ユーザーがログインしていません。');
    }
    setIsWaitingForDelete(false);
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : theme}>
      <CssBaseline />
      {isLoggedIn ? (
        !isWaitingForDelete ? (
          <>
            <AppMain
              items={items}
              setItems={setItems}
              hideDoneItems={hideDoneItems}
              setHideDoneItems={setHideDoneItems}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              handleLogout={handleLogout}
              setIsWaitingForDelete={setIsWaitingForDelete}
            />
            {isLoading && <CircularProgress sx={{ marginTop: 2 }} />}
          </>
        ) : (
          <>
            <Typography sx={{ marginBottom: 4 }} variant='h3'>
              <img src='/TaskTree.svg' alt='Task Tree' style={{ width: '35px', height: '35px', marginRight: '10px' }} />
              TaskTree<Typography variant='caption'>v2</Typography>
            </Typography>
            <Typography variant='body2' sx={{ marginY: 4 }}>
              アプリケーションのすべてのデータとアカウント情報が削除されます。この操作は取り消せません。削除しますか？
            </Typography>
            <Button
              onClick={handleDeleteAccount}
              variant={'contained'}
              startIcon={<DeleteForeverIcon />}
              color='error'
              sx={{ marginRight: 4 }}
            >
              削除する
            </Button>
            <Button onClick={() => setIsWaitingForDelete(false)} variant={'outlined'}>
              キャンセル
            </Button>
          </>
        )
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
