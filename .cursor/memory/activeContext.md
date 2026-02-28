# Active Context

## 現在のセッションの焦点

ドキュメントと実装の整合性を維持し、Weather/Playlist/Auth の単一ソース設計を崩さないこと。

## 現在の実装状態（要点）

- Next.js 16 / React 19 / TypeScript で App Router 構成
- 未ログイン利用を正式サポート（固定データでプレイリスト表示）
- ログイン時のみ OpenAI 生成 + Spotify Search でトラック URI を解決
- Spotify 認証は PKCE、セッションは暗号化クッキー + PKCE 準拠トークンリフレッシュ（client_id in body, no secret）
- Spotify API 呼び出しは共通 `spotifyFetch`（`lib/spotify-server.ts`）を使用（`spotify-web-api-node` 依存を廃止）
- Route Handler のクッキー操作は `NextResponse.cookies` に統一（`cookies()` + redirect の不整合を解消）
- 天気は WxTech 優先（日本 1km / 海外 5km）、失敗時 OWM にフォールバック
- 都市名は Google Geocoding の逆ジオコーディング（失敗時は OWM 名称）

## UI/UX の確定方針

- `SettingsPanel` は一覧（menu）→ 詳細（Select Genre / Appearance / Playback）構成
- Select Genre は最大 4 件。パネル閉じ時に追加ジャンル分のみ再生成
- Mood Tuning は即時プレビュー、閉じ時に変更があれば全件再生成
- レコード操作は 45° でページング、右 3 周で単体再生成、左 3 周で全件再生成
- 非ログイン時の保存導線は「Spotifyでログインして再生」
- Onboarding のチュートリアルモーダルはモバイルで `80dvh` を基準にし、メディアは `object-cover` でトリミング表示して余白を抑える

## データフローの単一ソース

- `WeatherContext` が `effectiveWeather` / `effectiveTimeOfDay` / `displayHour` を提供
- 視認性判定は `isCanvasBackgroundDark`（天気×時間帯）を使用
- オーバーレイテーマは `themePreference` と `isOverlayThemeDark` で独立管理
- 表示が実天気・実時間と異なるかは `isMoodTuningApplied` で判定
- プレイリスト再生成トリガーは `playlistRefreshTrigger` を経由

## 直近で注意すること

- ドキュメント内の ADR 番号は `decisionLog.md` と一致させる
- `themePreference` と `isCanvasBackgroundDark` を混同しない
- 既存ロジックの再利用を優先し、重複導出を追加しない

## 参照先

- アーキテクチャと連携: `.cursor/memory/systemPatterns.md`
- ADR と設計判断: `.cursor/memory/decisionLog.md`
- 実装前チェック: `.cursor/rules/pre-implementation-check.md`
- 複雑化時の整理: `.cursor/rules/refactor-overcomplexity.md`
