import { useEffect, useCallback, useState } from 'react';
import { TreeItem, AppState } from '../conponents/Tree/types'; // 必要な型をインポート
import { initialItems } from '../conponents/Tree/mock'; // 初期状態をインポート
import { isValidAppState } from '../conponents/Tree/utilities'; // 状態の検証関数をインポート
import { getAuth, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, set } from 'firebase/database';

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
) => {
  const [isLoadedFromExternal, setIsLoadedFromExternal] = useState(false);

  // エラーハンドリング
  const handleError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      setMessage('ログアウトしました。 : ' + error.message);
    } else {
      setMessage('ログアウトしました。不明なエラーが発生しました。');
    }
    setItems([]);
    signOut(getAuth());
    setIsLoggedIn(false);
    if (setIsLoading) setIsLoading(false);
  }, [setMessage, setItems, setIsLoggedIn, setIsLoading]);

  // itemsがTreeItem[]型であることを確認
  function isTreeItemArray(items: unknown): items is TreeItem[] {
    return Array.isArray(items) && items.every(item =>
      typeof item.id !== 'undefined' &&
      Array.isArray(item.children) &&
      typeof item.value === 'string'
    );
  }

  // 保存時に削除されたitemsのchildrenプロパティを復元
  function ensureChildrenProperty(items: TreeItem[]): TreeItem[] {
    return items.map(item => ({
      ...item,
      children: item.children ? ensureChildrenProperty(item.children) : []
    }));
  }

  // 状態の読み込みと監視
  useEffect(() => {
    if (isLoggedIn) {
      try {
        const user = getAuth().currentUser;
        if (!user) {
          throw new Error('ユーザーがログインしていません。');
        }
        setIsLoading(true);
        const db = getDatabase();
        const appStateRef = ref(db, `users/${user.uid}/appState`);

        // データベースの変更をリアルタイムで監視
        const unsubscribe = onValue(appStateRef, (snapshot) => {
          // データが存在する場合は取得し、itemsにセット
          if (snapshot.exists()) {
            const data: AppState = snapshot.val();
            const itemsWithChildren = ensureChildrenProperty(data.items);
            // 取得したデータがTreeItem[]型であることを確認
            if (isTreeItemArray(itemsWithChildren)) {
              setItems(itemsWithChildren);
            } else {
              throw new Error('取得したデータがTreeItem[]型ではありません。');
            }
            setHideDoneItems(data.hideDoneItems);
            setDarkMode(data.darkMode);
            setIsLoadedFromExternal(true);
            if (setIsLoading) setIsLoading(false);
          } else {
            // データが存在しない場合にのみinitialItemsを使用
            setItems(initialItems);
            if (setIsLoading) setIsLoading(false);
          }
        }, (error) => {
          // エラーハンドリングをここに追加
          if (setIsLoading) setIsLoading(false);
          handleError(error);
        });

        // クリーンアップ関数
        return () => unsubscribe();
      } catch (error) {
        if (setIsLoading) setIsLoading(false);
        handleError(error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // 状態が変更されたとき（例: アイテムの追加、完了タスクの表示/非表示の切り替え、ダークモードの切り替え）に保存
  useEffect(() => {
    const debounceSave = setTimeout(() => {
      const user = getAuth().currentUser;
      if (!user || !items) {
        return;
      }
      if (isLoadedFromExternal) {
        setIsLoadedFromExternal(false);
        return;
      }
      try {
        const appState = { items, hideDoneItems, darkMode };
        if (!isValidAppState(appState)) {
          throw new Error('保存する状態が指定された条件を満たしていません。');
        }
        const db = getDatabase();
        const appStateRef = ref(db, `users/${user.uid}/appState`);
        set(appStateRef, appState);
      } catch (error) {
        handleError(error);
      }
    }, 3000); // 3秒のデバウンス

    // コンポーネントがアンマウントされるか、依存配列の値が変更された場合にタイマーをクリア
    return () => clearTimeout(debounceSave);
  }, [items, hideDoneItems, darkMode, isLoadedFromExternal, handleError]);
};

export default useAppStateSync;