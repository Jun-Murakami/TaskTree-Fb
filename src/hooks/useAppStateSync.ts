import { useEffect, useCallback, useState } from 'react';
import { TreeItem, AppState } from '../Tree/types'; // 必要な型をインポート
import { initialItems } from '../Tree/mock'; // 初期状態をインポート
import { isValidAppState } from '../Tree/utilities'; // 状態の検証関数をインポート
import { getAuth, signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, getMetadata } from 'firebase/storage';


export const useAppStateSync = (
  items: TreeItem[],
  setItems: React.Dispatch<React.SetStateAction<TreeItem[]>>,
  hideDoneItems: boolean,
  setHideDoneItems: React.Dispatch<React.SetStateAction<boolean>>,
  darkMode: boolean,
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>,
  isLoggedIn: boolean,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setMessage: React.Dispatch<React.SetStateAction<string | null>>,
  lastUpdated: Date | null,
  setLastUpdated: React.Dispatch<React.SetStateAction<Date>>
) => {
  // ポーリングによって状態が更新されたかどうかを示すフラグ
  const [isLoadedFromExternal, setIsLoadedFromExternal] = useState(false);

  // 状態の読み込み
  useEffect(() => {
    if (isLoggedIn) {
      const fetchAndSetAppState = async () => {
        try {
          const user = getAuth().currentUser;
          if (!user) {
            throw new Error('ユーザーがログインしていません。');
          }

          const storage = getStorage();
          const storageRef = ref(storage, `${user.uid}/TaskTree.json`);

          // メタデータの取得
          getMetadata(storageRef)
            .then((metadata) => {
              const fileUpdated = new Date(metadata.updated);
              // lastUpdatedと比較
              if (!lastUpdated || (fileUpdated.getTime() - lastUpdated.getTime()) > 3000) {
                // 更新がある場合のみダウンロードを進める
                if (setIsLoading) setIsLoading(true);
                getDownloadURL(storageRef)
                  .then((url) => {
                    fetch(url)
                      .then((response) => response.json())
                      .then((appState: AppState) => {
                        if (isValidAppState(appState)) {
                          setItems(appState.items);
                          setHideDoneItems(appState.hideDoneItems);
                          setDarkMode(appState.darkMode);
                          setLastUpdated(fileUpdated);
                          setIsLoadedFromExternal(true);
                        }
                        if (setIsLoading) setIsLoading(false);
                      })
                      .catch((error) => {
                        // JSONのフェッチまたは解析に失敗した場合のエラーハンドリング
                        throw new Error('データの読み込みに失敗しました。' + error);
                      });
                  })
                  .catch((error) => {
                    // ファイルが存在しない場合の処理
                    console.error(error);
                    setItems(initialItems);
                    if (setIsLoading) setIsLoading(false);
                  });
              } else {
                // 更新がない場合は何もしない
                if (setIsLoading) setIsLoading(false);
              }
            })
            .catch(() => {
              // ファイルが存在しない場合の処理
              setItems(initialItems);
              if (setIsLoading) setIsLoading(false);
            });
        } catch (error) {
          handleError(error);
        }
      };

      fetchAndSetAppState();

      // ポーリングを開始
      const interval = setInterval(fetchAndSetAppState, 10000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, setDarkMode, setHideDoneItems, setIsLoading, setItems, lastUpdated, setLastUpdated]);



  // 状態の保存
  // Firebase Storageに状態を保存する
  const saveOrUpdateAppStateToFirebaseStorage = useCallback((appStateJSON: string) => {
    return new Promise((resolve, reject) => {
      (async () => {
        const appState = JSON.parse(appStateJSON);
        if (!isValidAppState(appState)) {
          reject(new Error('保存する状態が指定された条件を満たしていません。'));
          return;
        }

        const user = getAuth().currentUser;
        if (!user) {
          reject(new Error('ユーザー情報が取得できません。'));
          return;
        }
        const storage = getStorage();
        const storageRef = ref(storage, `${user.uid}/TaskTree.json`);
        const appStateBlob = new Blob([appStateJSON], { type: 'application/json' });

        uploadBytes(storageRef, appStateBlob)
          .then((snapshot) => {
            resolve(snapshot.metadata);
          })
          .catch((error) => {
            reject(error);
          });
      })();
    });
  }, []);

  // 状態が変更されたとき（例: アイテムの追加、完了タスクの表示/非表示の切り替え、ダークモードの切り替え）にGoogle Driveに状態を保存
  useEffect(() => {
    const debounceSave = setTimeout(() => {
      const user = getAuth().currentUser;
      if (!user) {
        return;
      }
      if (user && !isLoadedFromExternal) {
        const appState = { items, hideDoneItems, darkMode };
        const appStateJSON = JSON.stringify(appState);
        saveOrUpdateAppStateToFirebaseStorage(appStateJSON)
          .then(() => {
            setLastUpdated(new Date());
          })
          .catch((error: unknown) => {
            handleError(error);
          });
      } else if (user) {
        setIsLoadedFromExternal(false);
      }
    }, 3000); // 3秒のデバウンス

    return () => clearTimeout(debounceSave); // コンポーネントがアンマウントされるか、依存配列の値が変更された場合にタイマーをクリア
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hideDoneItems, darkMode, saveOrUpdateAppStateToFirebaseStorage, isLoadedFromExternal, setIsLoggedIn]);

  function handleError(error: unknown) {
    if (error instanceof Error) {
      setMessage('ログアウトしました。 : ' + error.message);
    } else {
      setMessage('ログアウトしました。不明なエラーが発生しました。');
    }
    setLastUpdated(new Date(0));
    setItems([]);
    signOut(getAuth());
    setIsLoggedIn(false);
    if (setIsLoading) setIsLoading(false);
  }
};



export default useAppStateSync;