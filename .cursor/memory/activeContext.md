# Active Context

## 現在のセッションの焦点

ハイドレーション不整合の解消とデータ同期の確実化

## 最近の変更履歴

- ハイドレーション不整合の解消:
  - `src/hooks/useLocalStorage.ts`: 第3の戻り値として `isInitialized: boolean` を追加
    - SSR時は `false`、localStorage読み込み完了後に `true`
  - `src/components/GenreSelector.tsx`: `useSelectedGenres` の戻り値を `[Genre[], boolean]` に変更
  - `src/components/PlaylistExplorer.tsx`:
    - `isGenresInitialized` フラグを受け取り、初期化完了時にプレイリストを自動同期
    - `hasPerformedInitialSyncRef` でリロード後の重複同期を防止
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
- リロード時のlocalStorage読み込み完了後にプレイリストを自動同期

## ジャンル選択の動作フロー

### 通常時（パネル操作）

1. 設定ボタンクリック → パネル開く → 現在のジャンルを記録
2. ジャンル選択/解除 → localStorageが更新 → 他コンポーネントに通知
3. 設定ボタンクリック → パネル閉じる → ジャンル差分を計算
4. 変更があればプレイリスト再生成（追加されたジャンルのみAPI呼び出し）

### リロード時（ハイドレーション同期）

1. SSR: 初期値（["J-POP"]）でレンダリング
2. クライアント: useEffect でlocalStorageから保存済みジャンルを読み込み
3. isInitialized が true になる
4. 初期プレイリストと保存済みジャンルを比較、差異があれば再生成

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
