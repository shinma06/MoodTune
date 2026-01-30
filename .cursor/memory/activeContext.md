# Active Context

## 現在のセッションの焦点

UI/UX 改善とコードベースのリファクタリング

## 最近の変更履歴

- Context による単一ソース化（背景・テキスト色・天気・時間帯）:
  - `WeatherContext` に `effectiveTimeOfDay`, `effectiveWeather`, `isDark` を追加
  - `effectiveTimeOfDay`: `testTimeOfDay` を考慮した表示用時間帯
  - `effectiveWeather`: `normalizeWeatherType` を適用した表示用天気
  - `isDark`: 背景が暗いかどうか（`isDarkBackground` の結果）
  - 全コンポーネント（`PlaylistExplorer`, `WeatherMonitor`, `WeatherTestPanel`, `WeatherAnimation`）が Context から取得し、常に一致
- テキスト色の視認性を堅牢化:
  - `getTopColor` で dusk 時に暗い扱いにする天気を拡張（Clouds/Drizzle/Mist/Haze を追加し、グラデーション下部の視認性を確保）
- 表示用時刻の単一ソース（displayHour）:
  - `WeatherContext` に `displayHour` を追加し、背景・テキスト色・アニメーションの時間帯判定を一括管理
  - Provider の `useEffect` でマウント時と1分ごとにクライアント現地時刻を更新（SSR/ハイドレーション・コンポーネント間のずれを防止）
- レコード自動回転:
  - アイドル時は 12 秒/周で常に回転（`useVinylRotation`）
  - ユーザーがドラッグすると自動回転を停止、離すと再開
- レコード色の表示ルール:
  - 現実のレコード色を使うのは (1) 初期同期時の stale J-POP (2) 空状態 のみ
  - それ以外は表示中のジャンルのテーマカラーを使用
- ジャンルごとのレコードグラデーション:
  - City Pop のような美しいグラデーションを他ジャンルにも適用
  - 派手すぎる場合は控えめに調整（K-POP Boy Group、Techno など）
- 気分に合わせるパネルの UI 統一:
  - ジャンル選択パネルと同じトグルボタン方式に変更（X ボタン削除）
  - Card スタイル、位置、選択枠の視認性を統一
- 初期同期時のローディング文言:
  - `loadingMode: "initial"` で「プレイリストを生成中」（"再生成" ではない）を表示
- generateDashboard のエラーハンドリング:
  - try/catch で空配列を返し、クライアントの unexpected response を防止
- プロジェクト全体のリファクタリング:
  - `src/types/dashboard.ts`: `DashboardItem` 型を専用ファイルに移動
  - `src/lib/playlist-utils.ts`: ユーティリティ関数・定数を集約
    - `hasGenresChanged`, `getGenresDiff`, `getImageUrl`
    - `getLoadingGenreText`, `getLoadingTitleText`
    - `EMPTY_PLAYLIST`, `LoadingMode`
  - `PlaylistExplorer.tsx`: ユーティリティ関数を import に変更し、524 → 約 490 行に削減

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
