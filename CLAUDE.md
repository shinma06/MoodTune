# MoodTune - Claude Code Project Guide

天気と時間帯に合わせた音楽プレイリスト提案アプリ。

---

## AI Development Protocols

### 1. Pre-Implementation Check（実装前チェック）

新機能の実装・変更を行う前に必ず確認すること（詳細: `.claude/rules/pre-implementation-check.md`）:

1. **機能連携の確認** — `WeatherContext` / `useLocalStorage` / `PlaylistExplorer` への影響把握
2. **既存実装との整合性** — 重複実装の回避。`lib/` のユーティリティ・定数を再利用
3. **スコープの最小化** — 1変更 = 1責務。大きな変更は分割する

### 2. Simplicity First（シンプル設計原則）

- **YAGNI** — 「将来必要かもしれない」抽象化はしない
- **静的テーブル** — 入力→出力が 1:1 で決まるロジックは静的定数で定義（`WEATHER_ICON_MAP` 等）
- **単一ソース** — 同じ導出ロジックを複数箇所に書かない（Context や共通関数で一元管理）
- **実装後の振り返り** — より簡単な方法がなかったか自問する。複雑化した場合は `.claude/rules/refactor-overcomplexity.md` を適用

### 3. Documentation Continuity

コードを変更した場合は `.cursor/memory/activeContext.md` の更新を検討すること（日付なし・相対的進行状況で記述）。

### 4. Language

- 思考プロセス・説明: **日本語**
- コードコメント・コミットメッセージ: **英語** または日本語（既存スタイルに合わせる）

---

## Tech Stack

| カテゴリ | 技術 |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript（厳格な型定義、`any`禁止） |
| Styling | Tailwind CSS 4.x（カスタムCSSは最小限） |
| UI Components | shadcn/ui（不足時は `npx shadcn@latest add`） |
| Icons | Lucide React |
| AI | Vercel AI SDK + OpenAI（gpt-4o） |
| Auth | Spotify PKCE (Authorization Code with PKCE) |
| Fonts | Geist (sans), Cormorant Garamond (serif) |

---

## Architecture Overview

### ディレクトリ構造

```
src/
├── app/
│   ├── actions/         # Server Actions（generateDashboard, saveToSpotify）
│   ├── api/             # API Routes
│   │   ├── auth/        # Spotify PKCE: spotify（認可）, spotify/callback（トークン交換）, signout, spotify/error
│   │   ├── geocode/     # 逆ジオコーディング（都市名取得）
│   │   ├── weather/     # weather, weather/owm-city プロキシ
│   ├── page.tsx         # メインページ（PageClient を返す）
│   ├── PageClient.tsx   # PlaylistExplorer + OnboardingOrchestrator
│   ├── layout.tsx       # ルートレイアウト（WeatherProvider）
│   └── loading.tsx
├── auth.ts              # セッション取得（auth()）。Spotify PKCE ログイン・同一インターフェース
├── components/
│   ├── ui/              # shadcn/ui コンポーネント
│   ├── PlaylistExplorer.tsx      # メイン画面（レコード UI）
│   ├── GenreSelector.tsx         # Select Genre（ジャンル選択）
│   ├── SettingsPanel.tsx         # Settings パネル（menu/detail）
│   ├── FloatingNoteEffect.tsx    # 音符エフェクト
│   ├── WeatherMonitor.tsx        # 天気モニター
│   ├── WeatherAnimation.tsx      # 天気アニメーション
│   ├── onboarding/               # Login/GenreSelect/Tutorial モーダル
│   └── WeatherMoodTuningPanel.tsx # Mood Tuning パネル
├── contexts/
│   └── WeatherContext.tsx        # 天気・時間帯・表示状態の単一ソース
├── hooks/
│   ├── useGeolocation.ts
│   ├── useLocalStorage.ts        # ジャンル選択の永続化（バリデーション・修復あり）
│   ├── useSettings.ts            # Settings 値の永続化（theme/rotation/tonearm/note/moodWeatherDisplay）
│   └── useVinylRotation.ts       # レコード回転（3周で再生成トリガー）
├── lib/
│   ├── constants.ts              # ジャンル定義・定数
│   ├── playlist-utils.ts         # プレイリスト関連ユーティリティ
│   ├── spotify-pkce.ts           # Spotify PKCE（認可URL・トークン交換）
│   ├── spotify-server.ts         # Spotify API クライアント（サーバー側）
│   ├── spotify-session.ts        # セッション暗号化クッキー・トークンリフレッシュ
│   ├── weather-api.ts            # 天気・Geocoding 並列取得
│   ├── weather-background.ts     # 背景グラデーション（BACKGROUNDS 静的定数）
│   ├── weather-background-utils.ts
│   ├── weather-utils.ts          # 天気アイコン・テーマ色（静的定数）
│   └── wxtech-weather.ts         # WxTech API（日本域判定・天気コードマッピング）
└── types/
    ├── dashboard.ts               # DashboardItem
    ├── spotify-web-api-node.d.ts  # 手動型定義（generateDashboard の Search 用）
    └── weather.ts
```

### データフロー

```
WeatherMonitor
  → 位置情報 → /api/weather (WxTech優先→OWM) + /api/geocode (並列)
  → WeatherContext 更新 (actualWeatherType, displayHour 等)
  → 10分ポーリング（Mood Tuning中はスキップ）

WeatherContext (単一ソース)
  → effectiveWeather / effectiveTimeOfDay / isCanvasBackgroundDark / isOverlayThemeDark / displayHour
  → 画面上UIは isCanvasBackgroundDark、モーダル・パネルは isOverlayThemeDark を参照

PlaylistExplorer
  → Context から表示用値取得 + useLocalStorage からジャンル取得
  → generateDashboard(weather, time, genres) Server Action
  → DashboardItem[] { genre, title, imageUrl, trackUris }

SettingsPanel
  → menu（Select Genre / Appearance / Playback / Account）から詳細へ遷移
  → Select Genre は localStorage 更新（最大4ジャンル）→ パネル閉じ時に差分計算 → 追加分のみ再生成
  → Appearance は themePreference（overlay専用）/ Mood Tuning中の天気表示モードを更新
  → Playback は自動回転/トーンアーム/音符エフェクトを更新

WeatherMoodTuningPanel (Mood Tuning)
  → Context を手動更新 → パネル閉じ時に全件再生成
```

### WeatherContext の責務

```
actualWeatherType / actualTimeOfDay  → 実際の天気・時間帯
moodTuningTimeOfDay / isMoodTuning   → Mood Tuning 手動設定値
effectiveWeather / effectiveTimeOfDay → 表示用（Mood Tuning優先）
isCanvasBackgroundDark               → キャンバス背景が暗いか（画面上テキスト・アイコン視認性用、天気×時間帯）
themePreference                      → overlay テーマ設定（time/light/dark/system）
isOverlayThemeDark                   → モーダル・パネルのテーマ（themePreference + system を反映、canvas判定とは独立）
displayHour                          → 表示用時刻（1分ごと更新）
isTimeInitialized                    → クライアント時刻設定完了フラグ
playlistRefreshTrigger               → プレイリスト再生成トリガー
```

---

## Key Design Decisions

- **ADR-009**: `effectiveWeather`, `effectiveTimeOfDay`, `isCanvasBackgroundDark`, `isOverlayThemeDark` は WeatherContext で一元管理
- **ADR-018**: Spotify 認証は PKCE に統一し、セッション暗号化クッキー + 自動リフレッシュで管理する
- **ADR-019**: `themePreference` は overlay UI のみに適用し、`isCanvasBackgroundDark`（メイン画面視認性）は天気×表示時間の静的テーブルで維持
- **ADR-010**: ジャンル選択は localStorage 永続化。空配列は「永続化として無効」→リロード時にデフォルトに修復
- **ADR-011**: 同一ページ内のジャンル変更では空配列でも即座に修復しない（UX考慮）
- **ADR-012**: ジャンル変更時のプレイリスト更新は差分のみ（追加分だけ API 呼び出し）
- **ADR-013**: レコード右3周 = 表示中ジャンル単体再生成、左3周 = 全件再生成
- **ADR-016**: SSR/初回は `displayHour=0`、クライアント現地時刻設定後 `isTimeInitialized=true` に
- **ADR-017**: 天気10分ポーリングは Mood Tuning 中はスキップ

---

## Code Style

```typescript
// ✓ constで関数定義
const getWeatherIcon = (type: WeatherType): LucideIcon => { ... }

// ✓ 決定的マッピングは静的定数
const WEATHER_ICON_MAP: Record<WeatherType, LucideIcon> = { Clear: Sun, ... }

// ✓ @/ エイリアス使用
import { DashboardItem } from "@/types/dashboard"

// ✓ 複雑な関数には明示的な戻り値型
async function generateDashboard(...): Promise<DashboardItem[]> { ... }

// ✗ any 禁止
// ✗ 「将来用」の抽象化禁止
```

- `use client` はフック・インタラクティビティが必要な場合のみ
- Server Components をデフォルトとする
- shadcn/ui が存在する場合はカスタムスタイルを発明しない
- パッケージマネージャー: **npm**

---

## Spotify Integration (現在の実装状態)

- **非ログインモード（正式）**: 未ログイン時でもアプリは利用可能。`generateDashboard` は `lib/mock-playlist-data.ts` の固定データを返し、Spotify 固有機能は利用不可
- Spotify PKCE。`GET /api/auth/spotify` で認可 → コールバックでトークン取得 → セッションは暗号化クッキー。リフレッシュは spotify-session で自動
- **`generateDashboard`**: ログイン時は GPT-4o → ジャンルごと15曲 `{artist, title}` → Spotify Search で URI + ジャケ写（ヒットしない場合はフォールバック画像）。未ログイン時は固定データ
- **`saveToSpotify`**: セッショントークンで Spotify API を直接 fetch。"MoodTune" プレイリスト1本を上書き or 新規作成。未ログイン時のボタン文言は「Spotifyでログインして再生」

---

## Environment Variables

```bash
# 必須
OPENAI_API_KEY=...

# Spotify（ログイン利用時）
AUTH_SECRET=...                       # セッション暗号化（32文字以上推奨）
AUTH_SPOTIFY_ID=...
AUTH_SPOTIFY_SECRET=...
AUTH_URL=http://127.0.0.1:3000        # または NEXTAUTH_URL。コールバックURL算出に使用（ポート要一致）

# 天気（推奨）
WXTECH_API_KEY=...                    # WxTech（日本1km/海外5km）
NEXT_PUBLIC_WEATHER_API_KEY=...       # OpenWeatherMap（フォールバック）
GOOGLE_GEOCODING_API_KEY=...          # 都市名取得（逆ジオコーディング）
```

**最小構成（非ログイン）**: 環境変数不要で動作（固定データで動作）。
**Spotify 連携時**: `OPENAI_API_KEY` と認証関連を設定し、Redirect URI を Dashboard に登録。

---

## Dev Commands

```bash
npm run dev       # 開発サーバー
npm run build     # プロダクションビルド
npx tsc --noEmit  # 型チェック
```
