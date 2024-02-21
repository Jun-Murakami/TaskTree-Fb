import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { findMaxId, isDescendantOfTrash, isValidAppState } from './Tree/utilities';
import { SortableTree } from './Tree/SortableTree';
import type { TreeItem } from './Tree/types';
import { styled } from '@mui/material/styles';
import { FormControlLabel, Switch, Button, Box, Typography, Grid, IconButton } from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import './App.css';

interface AppProps {
  items: TreeItem[];
  setItems: Dispatch<SetStateAction<TreeItem[]>>;
  hideDoneItems: boolean; // この行を追加
  setHideDoneItems: Dispatch<SetStateAction<boolean>>; // この行を追加
  darkMode: boolean;
  setDarkMode: Dispatch<SetStateAction<boolean>>;
}

function App({ items, setItems, hideDoneItems, setHideDoneItems, darkMode, setDarkMode }: AppProps) {
  const [lastSelectedItemId, setLastSelectedItemId] = useState<UniqueIdentifier | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleSelect = (id: UniqueIdentifier) => {
    setLastSelectedItemId(id);
  };

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHideDoneItems(event.target.checked);
  };

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
      // 以前のロジックを使用して、選択したアイテムの直下に新しいアイテムを追加
      const updatedItems = addItemToNestedChildren(items, lastSelectedItemId, newTask);
      setItems(updatedItems);
    }
  };

  const handleDownloadAppState = () => {
    const appState = { items, hideDoneItems, darkMode, lastUpdated: new Date() };
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

  const hiddenFileInput = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    hiddenFileInput.current?.click();
  };

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

  const MaterialUISwitch = styled(Switch)(({ theme }) => ({
    width: 62,
    height: 34,
    padding: 7,
    '& .MuiSwitch-switchBase': {
      margin: 1,
      padding: 0,
      transform: 'translateX(6px)',
      '&.Mui-checked': {
        color: '#fff',
        transform: 'translateX(22px)',
        '& .MuiSwitch-thumb:before': {
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
            '#fff'
          )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
        },
        '& + .MuiSwitch-track': {
          opacity: 1,
          backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : theme.palette.primary.light,
        },
      },
    },
    '& .MuiSwitch-thumb': {
      backgroundColor: theme.palette.mode === 'light' ? theme.palette.background.default : theme.palette.primary.main,
      width: 32,
      height: 32,
      '&::before': {
        content: "''",
        position: 'absolute',
        width: '100%',
        height: '100%',
        left: 0,
        top: 0,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.primary.main
        )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
      },
    },
    '& .MuiSwitch-track': {
      opacity: 1,
      backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
      borderRadius: 20 / 2,
    },
  }));

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
      <Grid container spacing={2} justifyContent='center' sx={{ marginTop: { xs: 0, sm: '30px' }, marginBottom: '20px' }}>
        <Grid
          item
          xs={12}
          sm={3}
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
        <Grid item xs={6} sm={3}>
          <FormControlLabel
            control={<Switch checked={hideDoneItems} onChange={handleSwitchChange} />}
            label={<Typography sx={{ fontSize: '0.9em' }}>完了を非表示</Typography>}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <FormControlLabel control={<MaterialUISwitch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />} label='' />
          <input type='file' ref={hiddenFileInput} onChange={handleFileUpload} style={{ display: 'none' }} accept='.json' />
          <IconButton onClick={handleClick}>
            <UploadIcon />
          </IconButton>
          <IconButton onClick={handleDownloadAppState}>
            <DownloadIcon />
          </IconButton>
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
      <Box
        sx={{
          zIndex: 1000,
          display: { xs: 'flex', sm: 'none' }, // スマホサイズでのみ表示
          position: 'fixed',
          bottom: 20,
          left: 80,
          width: '100%',
          justifyContent: 'left',
        }}
      >
        <Button variant='contained' color='primary' startIcon={<AddIcon />} sx={{ width: '40%' }} onClick={handleAddTask}>
          タスク追加
        </Button>
      </Box>
    </Box>
  );
}

export default App;
