import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { findMaxId, isDescendantOfTrash, isValidAppState } from './conponents/Tree/utilities';
import { SortableTree } from './conponents/Tree/SortableTree';
import type { TreeItem } from './conponents/Tree/types';
import SettingsMenu from './conponents/SettingsMenu';
import { FormControlLabel, Switch, Button, Box, Typography, Grid } from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import './App.css';

interface AppProps {
  items: TreeItem[];
  setItems: Dispatch<SetStateAction<TreeItem[]>>;
  hideDoneItems: boolean;
  setHideDoneItems: Dispatch<SetStateAction<boolean>>;
  darkMode: boolean;
  setDarkMode: Dispatch<SetStateAction<boolean>>;
  handleLogout: () => void;
}

function App({ items, setItems, hideDoneItems, setHideDoneItems, darkMode, setDarkMode, handleLogout }: AppProps) {
  const [lastSelectedItemId, setLastSelectedItemId] = useState<UniqueIdentifier | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // 選択したアイテムのIDをセットする
  const handleSelect = (id: UniqueIdentifier) => {
    setLastSelectedItemId(id);
  };

  // 完了したアイテムを非表示にする
  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHideDoneItems(event.target.checked);
  };

  // ネストされたアイテムにアイテムを追加する
  const addItemToNestedChildren = (items: TreeItem[], parentId: UniqueIdentifier, newItem: TreeItem): TreeItem[] => {
    return items.map((item) => {
      if (item.id === parentId) {
        if (!item.children) {
          item.children = [];
        }
        item.children.push(newItem);
        return item;
      } else if (item.children) {
        item.children = addItemToNestedChildren(item.children, parentId, newItem);
        return item;
      }
      return item;
    });
  };

  // タスクを追加する
  const handleAddTask = () => {
    const newTaskId = findMaxId(items) + 1;
    const newTask = {
      id: newTaskId.toString(),
      value: '',
      done: false,
      children: [],
    };

    if (
      lastSelectedItemId === 'trash' ||
      (lastSelectedItemId !== null && isDescendantOfTrash(items, lastSelectedItemId)) ||
      lastSelectedItemId === null
    ) {
      // ゴミ箱のルートツリーの直前のルートにタスクを追加
      const newItems = [...items]; // 現在のアイテムのコピーを作成
      const trashIndex = newItems.findIndex((item) => item.id === 'trash');
      if (trashIndex > 0) {
        // ゴミ箱がリストの最初でない場合、ゴミ箱の直前に新しいタスクを挿入
        newItems.splice(trashIndex, 0, newTask);
      } else {
        // ゴミ箱がリストの最初または見つからない場合、リストの最初に追加
        newItems.unshift(newTask); // 配列の先頭に追加
      }
      setItems(newItems); // 更新されたアイテムの配列をセット
    } else {
      // 選択したアイテムの直下に新しいアイテムを追加
      const updatedItems = addItemToNestedChildren(items, lastSelectedItemId, newTask);
      setItems(updatedItems);
    }
  };

  // アプリの状態をJSONファイルとしてダウンロードする
  const handleDownloadAppState = () => {
    const appState = { items, hideDoneItems, darkMode };
    const appStateJSON = JSON.stringify(appState, null, 2); // 読みやすい形式でJSONを整形
    const blob = new Blob([appStateJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'TaskTree_Backup.json'; // ダウンロードするファイルの名前
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ファイルを読み込んでアプリの状態を復元する
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      try {
        const appState = JSON.parse(text as string);
        if (!isValidAppState(appState)) {
          alert('無効なファイル形式です。');
          return;
        } else {
          setItems(appState.items);
          setHideDoneItems(appState.hideDoneItems);
          setDarkMode(appState.darkMode);
          alert('ファイルが正常に読み込まれました。');
        }
      } catch (error) {
        alert('ファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 50); // 50px以上スクロールしたらtrueにする
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box
      sx={{
        maxWidth: '900px', // 最大幅を指定
        width: '100%', // 横幅いっぱいに広がる
        margin: '0 auto', // 中央寄せ
      }}
    >
      <Typography variant='h3'>
        <img
          src='/TaskTree.svg'
          alt='Task Tree'
          style={{ width: '35px', height: '35px', marginTop: '30px', marginRight: '10px' }}
        />
        TaskTree
      </Typography>
      <Grid
        container
        spacing={2}
        sx={{
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto',
          marginTop: { xs: 0, sm: '30px' },
          marginBottom: '20px',
        }}
      >
        <Grid
          item
          xs={12}
          sm={4}
          sx={{
            display: { xs: 'none', sm: 'block' }, // スマホサイズで非表示
            position: isScrolled ? 'fixed' : 'relative', // スクロールに応じて位置を固定
            top: isScrolled ? 0 : 'auto', // スクロール時は上部に固定
            zIndex: isScrolled ? 1000 : 'auto', // スクロール時は他の要素より前面に
            width: isScrolled ? '100%' : 'auto', // スクロール時は幅を100%に
          }}
        >
          <Button
            variant='contained'
            color='primary'
            startIcon={<AddIcon />}
            sx={{ width: '100%', maxWidth: '400px' }}
            onClick={handleAddTask}
          >
            タスクを追加
          </Button>
        </Grid>
        <Grid item xs={6} sm={4} sx={{ width: '100%', margin: '0 auto' }}>
          <FormControlLabel
            control={<Switch checked={hideDoneItems} onChange={handleSwitchChange} />}
            label={<Typography sx={{ fontSize: '0.9em' }}>完了を非表示</Typography>}
          />
        </Grid>
        <Grid item xs={6} sm={4} sx={{ width: '100%', margin: '0 auto' }}>
          <SettingsMenu
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            handleFileUpload={handleFileUpload}
            handleDownloadAppState={handleDownloadAppState}
            handleLogout={handleLogout}
          />
        </Grid>
      </Grid>
      <SortableTree
        collapsible
        indicator
        removable
        hideDoneItems={hideDoneItems}
        items={items}
        darkMode={darkMode}
        setItems={setItems}
        onSelect={handleSelect}
      />
      <Button
        variant='contained'
        color='primary'
        startIcon={<AddIcon />}
        onClick={handleAddTask}
        sx={{
          zIndex: 1000,
          display: { xs: 'flex', sm: 'none' }, // スマホサイズでのみ表示
          position: 'fixed',
          width: '60%', // 幅を40%に設定
          bottom: 20,
          left: '50%', // 左端から50%の位置に設定
          transform: 'translateX(-50%)', // X軸方向に-50%移動して中央寄せ
        }}
      >
        タスク追加
      </Button>
    </Box>
  );
}

export default App;
