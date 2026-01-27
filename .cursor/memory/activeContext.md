# Active Context

## 現在のセッションの焦点

ジャンル選択機能の同期改善とプロジェクト全体のリファクタリング

## 最近の変更履歴

- ジャンル選択とプレイリスト生成の同期改善:
  - `src/hooks/useLocalStorage.ts`: カスタムイベントで同一ページ内のlocalStorage変更を通知
  - `src/components/PlaylistExplorer.tsx`: パネルを閉じた際に差分更新を実行
  - 変更のないジャンルはデータを再利用（API呼び出し削減）
- undefinedエラーの修正:
  - `displayPlaylists`が空の場合のフォールバック追加
  - `safeCurrentIndex`で常に有効な範囲内のインデックスを保証
  - `EMPTY_PLAYLIST`定数で空状態のプレースホルダーを提供
- プロジェクト全体のリファクタリング:
  - `src/lib/constants.ts`: `GENRE_STORAGE_KEY`, `DEFAULT_SELECTED_GENRES`を追加
  - `src/components/GenreSelector.tsx`: 共通定数を使用
  - `src/app/page.tsx`: 共通定数を使用
  - ユーティリティ関数の整理（`getVinylColors`, `getImageUrl`, `hasGenresChanged`, `getGenresDiff`）
  - `useMemo`による最適化

## 現在の開発状態

- Spotify認証フローが実装済み
- モックモード（NEXT_PUBLIC_USE_MOCK_SPOTIFY=true）で開発可能
- AI生成によるプレイリスト提案機能が動作
- ジャンル選択のパネル閉時に差分更新が動作

## ジャンル選択の動作フロー

1. 設定ボタンクリック → パネル開く → 現在のジャンルを記録
2. ジャンル選択/解除 → localStorageが更新 → 他コンポーネントに通知
3. 設定ボタンクリック → パネル閉じる → ジャンル差分を計算
4. 変更があればプレイリスト再生成（追加されたジャンルのみAPI呼び出し）

## 必要な環境変数

```
AUTH_SPOTIFY_ID=your_spotify_client_id
AUTH_SPOTIFY_SECRET=your_spotify_client_secret
AUTH_SECRET=your_random_secret_string
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_USE_MOCK_SPOTIFY=true  # モックモード有効化
```

## 次の優先事項

- Spotify API連携の本番テスト
- トークンリフレッシュ機能の実装
- プレイリスト保存機能の実装
