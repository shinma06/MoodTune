# Active Context

## 現在のセッションの焦点

プロジェクト全体のリファクタリングを完了。構造と実装の両面から整理し、今後の開発をスムーズにする。

## リファクタリング完了内容

### 共通化・重複排除
- `lib/validators.ts`: バリデーション関数を一元化（isThemePreference, isValidGenreArray 等）
- `lib/overlay-theme.ts`: オーバーレイのダーク/ライトスタイルを `getOverlayStyles()` で共通化
- `components/shared/SpotifyIcon.tsx`: Spotify SVG アイコンを共有コンポーネント化

### コンポーネント分割
- `hooks/usePlaylistManager.ts`: PlaylistExplorer からプレイリスト状態・生成・更新ロジックを抽出（PlaylistExplorer 661行 → 473行）
- `hooks/useSelectedGenres.ts`: GenreSelector 内の `useSelectedGenres` を独立フックに移動
- GenreSelector: 3つの表示モードを1つのコンポーネントに統一
- GenreSelectModal: 重複スタイル定義を `getOverlayStyles` に移行

### API 実装の最新化
- `generateDashboard`: Vercel AI SDK v6 `Output.array()` + zod スキーマに移行（regex JSON 抽出を廃止）
- `mapWithConcurrency`: `lib/utils.ts` に移動し再利用可能に
- `lib/weather-fetch.ts`: Weather Route から fetch ロジックを抽出（route handler 162行 → 52行）
- `findMoodTunePlaylist`: while(true) → for ループに変更、ページネーション安全上限追加

### パフォーマンス最適化
- `WeatherContext`: value オブジェクトを `useMemo` でメモ化し不要な再レンダリングを削減

### 依存関係整理
- 38 の未使用パッケージを削除（26 の @radix-ui コンポーネント、form 関連、chart 関連等）

## 現在の実装状態（要点）

- Next.js 16 / React 19 / TypeScript で App Router 構成
- 未ログイン利用を正式サポート（固定データでプレイリスト表示）
- ログイン時のみ OpenAI 生成 + Spotify Search でトラック URI を解決
- Spotify 認証は PKCE、セッションは暗号化クッキー + 自動リフレッシュ
- 天気は WxTech 優先、失敗時 OWM にフォールバック

## データフローの単一ソース

- `WeatherContext` が `effectiveWeather` / `effectiveTimeOfDay` / `displayHour` を提供
- 視認性判定は `isCanvasBackgroundDark`（天気×時間帯）を使用
- オーバーレイテーマは `themePreference` と `isOverlayThemeDark` で独立管理
- プレイリスト管理は `usePlaylistManager` フックに集約

## 直近で注意すること

- `themePreference` と `isCanvasBackgroundDark` を混同しない
- 既存ロジックの再利用を優先し、重複導出を追加しない
- 新しいオーバーレイコンポーネントは `getOverlayStyles()` を使う
- バリデーション追加時は `lib/validators.ts` に集約する

## 参照先

- アーキテクチャと連携: `.cursor/memory/systemPatterns.md`
- ADR と設計判断: `.cursor/memory/decisionLog.md`
- 実装前チェック: `.cursor/rules/pre-implementation-check.md`
- 複雑化時の整理: `.cursor/rules/refactor-overcomplexity.md`
