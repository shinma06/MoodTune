# Active Context

## 現在のセッションの焦点

UI/UX 改善とコードベースのリファクタリング、Vibeコーディング効率の最大化

## 最近の変更履歴

- 天気取得を WxTech 優先に変更（API 切り替え完了、テスト用表示は削除済み）:
  - `GET /api/weather`: WxTech を優先。日本域は 1km メッシュ ピンポイント（`/api/v1/ss1wx`）、海外は 5km メッシュ 世界天気予報（`/api/v2/global/wx`）。失敗時は OpenWeatherMap にフォールバック。レスポンスは OpenWeatherMap 互換に正規化（クライアント変更不要）
  - Base URL は `https://wxtech.weathernews.com`（api. サブドメインは付けない）。公式エンドポイントは `lib/wxtech-weather.ts` のコメントに記載
  - `lib/wxtech-weather.ts`: 日本域判定、天気コード(wx) → WeatherType マッピング
  - 環境変数: `WXTECH_API_KEY`（WxTech）、`NEXT_PUBLIC_WEATHER_API_KEY`（OWM フォールバック）
- 都市名取得を Google Geocoding API（逆ジオコーディング）に移行:
  - `GET /api/geocode?lat=&lon=` を新設。`GOOGLE_GEOCODING_API_KEY` で逆ジオコーディングし、最もローカルな地名のみ返す（locality > administrative_area_level_2 > level_1）。本番では Referer を送り、開発では送らない
  - `fetchWeatherData`: 天気と Geocoding を `Promise.all` で並列取得。都市名は Geocoding の `city` を優先し、失敗・空の場合は天気APIの `name`（OWM 時のみ）にフォールバック
- 初回アクセス時の背景・時間帯の初期化修正:
  - `WeatherContext`: `isTimeInitialized` を追加。SSR/初回はサーバー時刻に依存せず、`displayHour` を 0 で初期化。`useEffect` でクライアント現地時刻を設定したあと `isTimeInitialized = true` にし、時間帯に応じた背景を有効化
  - 未初期化時は `effectiveTimeOfDay = "day"`, `isDark = false` で中性背景時の UI と揃える
  - `weather-background-utils.ts`: `INITIAL_BACKGROUND_GRADIENT` 定数を追加（中性グラデーション）
  - `PlaylistExplorer`: `isTimeInitialized` が true になるまで `INITIAL_BACKGROUND_GRADIENT` を使用し、確定後に天気・時間帯に応じた背景へ切り替え
  - `layout.tsx`: body に `INITIAL_BACKGROUND_GRADIENT` を付与し、コンテンツ到着前も白画面を避ける
  - `app/loading.tsx`: ページ非同期ロード中のフォールバックに同じ中性背景を適用
- Vibeコーディング効率向上のための AI ルール強化:
  - `.cursorrules` に「5. Pre-Implementation Check」「6. Simplicity First」を追加
  - `.cursor/rules/pre-implementation-check.md` を新規作成（実装前チェックリスト、機能連携ポイント）
  - `systemPatterns.md` に「設計原則（技術負債回避）」セクションを追加
- リファクタリング: 静的テーブル化
  - `weather-background.ts`: `BACKGROUNDS` 定数に背景グラデーションを移動
  - `weather-utils.ts`: `WEATHER_ICON_MAP`, `WEATHER_THEME_COLORS`, `WEATHER_THEME_COLORS_DARK` を静的定数化

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
  - Provider の `useEffect` でマウント時と 1 分ごとにクライアント現地時刻を更新（SSR/ハイドレーション・コンポーネント間のずれを防止）
- レコード自動回転:
  - アイドル時は 12 秒/周で常に回転（`useVinylRotation`）
  - ユーザーがドラッグすると自動回転を停止、離すと再開
  - ジャンル1つ選択時（ページネーション不可）: 45°以上回して離しても next/prev せず、離した角度からアイドル回転を再開（`canPaginate: displayPlaylists.length > 1`）
- レコード色の表示ルール:
  - 現実のレコード色を使うのは (1) 初期同期時の stale J-POP (2) 空状態 のみ
  - それ以外は表示中のジャンルのテーマカラーを使用
- ジャンルごとのレコードグラデーション:
  - City Pop のような美しいグラデーションを他ジャンルにも適用
  - 派手すぎる場合は控えめに調整（K-POP (Boy)、Techno など）
- Mood Tuning パネルの UI 統一:
  - ジャンル選択パネルと同じトグルボタン方式に変更（X ボタン削除）
  - Card スタイル、位置、選択枠の視認性を統一
- 初期同期時のローディング文言:
  - `loadingMode: "initial"` で「プレイリストを生成中」（"再生成" ではない）を表示
- generateDashboard のエラーハンドリング:
  - try/catch で空配列を返し、クライアントの unexpected response を防止
- Mood Tuning「実際の天気・時間に戻す」ボタン:
  - 表示条件を「パネルを開いた時点で実際の天気・時間と違う状態を設定していた場合のみ」に変更
  - `showResetButton` を UI に適用（従来の `isTestMode` から切り替え）
  - 未設定（null）時は「実際と同じ」とみなし、誤表示しないよう算出を修正
- ジャンルが意図せず0件で保存される対策（堅牢化）:
  - `isValidGenreArray`: 空配列を「永続化として無効」にし、読み込み時は `DEFAULT_SELECTED_GENRES` を使用
  - `useLocalStorage`: 初回読み込み・他タブ変更時に無効値（例: 空配列）を検出したら `initialValue` で修復。同一ページ内での書き込みでは無効値もそのまま state に反映し修復しない（0件の選択解除が即座に戻らないようにする）
  - パネルで全解除したままリロードすると、次回読み込みでデフォルトジャンルが復元される
- プロジェクト全体のリファクタリング:
  - `src/types/dashboard.ts`: `DashboardItem` 型を専用ファイルに移動
  - `src/lib/playlist-utils.ts`: ユーティリティ関数・定数を集約
    - `hasGenresChanged`, `getGenresDiff`, `getImageUrl`
    - `getLoadingGenreText`, `getLoadingTitleText`
    - `EMPTY_PLAYLIST`, `LoadingMode`
  - `PlaylistExplorer.tsx`: ユーティリティ関数を import に変更し、524 → 約 490 行に削減

## 現在の開発状態

- Spotify 認証フローが実装済み
- モックモード（NEXT_PUBLIC_USE_MOCK_SPOTIFY=true）で開発可能
- AI 生成によるプレイリスト提案機能が動作
- ジャンル選択のパネル閉時に差分更新が動作
- リロード時の localStorage 読み込み完了後にプレイリストを自動同期

## ジャンル選択の動作フロー

### 通常時（パネル操作）

1. 設定ボタンクリック → パネル開く → 現在のジャンルを記録
2. ジャンル選択/解除 → localStorage が更新 → 他コンポーネントに通知
3. 設定ボタンクリック → パネル閉じる → ジャンル差分を計算
4. 変更があればプレイリスト再生成（追加されたジャンルのみ API 呼び出し）

### リロード時（ハイドレーション同期）

1. SSR: 初期値（["J-POP"]）でレンダリング
2. クライアント: useEffect で localStorage から保存済みジャンルを読み込み
3. isInitialized が true になる
4. 初期プレイリストと保存済みジャンルを比較、差異があれば再生成

## 必要な環境変数

```
AUTH_SPOTIFY_ID=your_spotify_client_id
AUTH_SPOTIFY_SECRET=your_spotify_client_secret
AUTH_SECRET=your_random_secret_string
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_USE_MOCK_SPOTIFY=true  # モックモード有効化
NEXT_PUBLIC_WEATHER_API_KEY=...    # OpenWeatherMap（天気取得）
GOOGLE_GEOCODING_API_KEY=...       # Google Geocoding（都市名取得、サーバー側のみ）
WXTECH_API_KEY=...                 # WxTech（天気・日本1km/世界5km）。未設定時は OWM のみ
```

## 次の優先事項

- Spotify API 連携の本番テスト
- トークンリフレッシュ機能の実装
- プレイリスト保存機能の実装
