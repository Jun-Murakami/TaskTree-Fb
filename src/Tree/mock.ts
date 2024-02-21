import { TreeItem } from './types';

export const initialItems: TreeItem[] = [
  {
    id: '0',
    value: 'すぐやる',
    done: false,
    children: [
      { id: '2', value: 'Aさんに電話を掛ける\n000-0000-0000', done: false, children: [] },
      { id: '3', value: 'Bさんにメールを返す', done: true, children: [] },
    ],
  },
  {
    id: '4',
    value: 'あとでやる',
    done: false,
    children: [
      { id: '5', value: 'Cさんを会食に誘う', done: false, children: [] },
    ],
  },
  {
    id: '6',
    value: '案件1',
    done: false,
    children: [
      {
        id: '7', value: '考え中', done: false, children: [
          { id: '8', value: '資料を集める', done: false, children: [] },
        ],
      },
      {
        id: '9', value: '作業中', done: false, children: [
          { id: '10', value: '企画書の作成', done: false, children: [] },
        ]
      },
    ],
  },
  {
    id: '11',
    value: 'メモ',
    done: false,
    children: [
      { id: '12', value: '10月2日はDさんの誕生日', done: false, children: [] },
    ],
  },
  {
    id: '13',
    value: '買い物リスト',
    done: false,
    children: [
      { id: '14', value: '洗剤', done: true, children: [] },
      { id: '15', value: '消しゴム', done: false, children: [] },
    ],
  },
  {
    id: 'trash',
    value: 'Trash',
    children: [],
  },
];