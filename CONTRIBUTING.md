# Contributing to MoodTune

MoodTune への貢献ありがとうございます。このドキュメントは、開発環境の準備からプルリクエストまでの流れと、プロジェクトのコーディング規約をまとめたものです。

---

## 開発環境の準備

1. リポジトリをクローンし、依存関係をインストールする
   ```bash
   git clone https://github.com/shinma06/MoodTune.git
   cd MoodTune
   npm install
   ```
2. [README.md](./README.md) の「環境変数」に従い `.env.local` を用意する（最低限 `OPENAI_API_KEY` でモックモードが動作します）
3. `npm run dev` で開発サーバーを起動し、動作を確認する

---

## 貢献の流れ

1. 対象リポジトリで Issue を確認するか、新規 Issue で変更内容を提案する
2. メインブランチから作業用ブランチを切る（例: `feature/xxx`, `fix/xxx`）
3. 変更を加え、`npm run lint` でエラーがないことを確認する
4. プルリクエストを作成し、変更内容・関連 Issue を記載する
5. レビュー後、メンテナがマージする

---

## コーディング規約

### 技術スタック・方針

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript（明示的な型定義を推奨、`any` は避ける）
- **Styling**: Tailwind CSS のみ。UI コンポーネントは shadcn/ui を優先する
- **Components**: 関数コンポーネント。デフォルトは Server Component、`useState` 等が必要な場合のみ `'use client'` を使用する

### ディレクトリ・ファイル

- ページ・ルーティング: `src/app/`
- UI コンポーネント: `src/components/`（shadcn は `components/ui/`）
- ビジネスロジック・API クライアント: `src/lib/`
- 型定義: `src/types/`
- カスタムフック: `src/hooks/`
- グローバル状態: `src/contexts/`

### 命名規則

- コンポーネント・ファイル: PascalCase（例: `PlaylistExplorer.tsx`）
- ユーティリティ・設定: kebab-case（例: `weather-utils.ts`）
- 定数: UPPER_SNAKE_CASE
- 関数・変数: camelCase

### 設計の心がけ

- **単一責任**: 1 つの関数・コンポーネントは 1 つの責務に絞る
- **DRY**: 同じロジックは 1 箇所にまとめる（`lib/` のユーティリティや Context を活用）
- **YAGNI**: 今の要件を満たす範囲で実装し、不要な抽象化を避ける
- **決定的なマッピング**: 入力→出力が一意に決まるものは、関数内オブジェクトではなく静的定数で定義する（例: `WEATHER_ICON_MAP`, `BACKGROUNDS`）

新機能・変更前には `.cursor/rules/pre-implementation-check.md` のチェックリストを参照し、実装後に複雑さを感じた場合は `.cursor/rules/refactor-overcomplexity.md` の手順を検討してください。

---

## 変更時の注意（機能連携）

以下の連携を壊さないよう、変更前に影響範囲を確認してください。

| 役割                                  | 役割の概要                                                                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **WeatherContext**                    | 天気・時間帯・表示用の `effectiveWeather` / `effectiveTimeOfDay` / `isDark` の単一ソース。Mood Tuning の手動値もここで管理 |
| **useLocalStorage (selected-genres)** | ジャンル選択の永続化。空配列は無効として扱い、初回・他タブ時はデフォルトに修復                                             |
| **PlaylistExplorer**                  | Context とジャンルを統合し、プレイリスト表示・差分更新・全件再生成を担当                                                   |

- 天気・時間帯を表示に使うコンポーネントは、**WeatherContext** から取得した値を使う（ローカルで別計算しない）
- ジャンル一覧は **useLocalStorage** と **constants.ts** の `AVAILABLE_GENRES` / `GENRE_THEME_COLORS` を参照する
- プレイリストの生成・更新は **Server Action**（`generateDashboard`）と **PlaylistExplorer** のフローに沿って行う

---

## リント・ビルド

- `npm run lint` で ESLint を実行する
- `npm run build` で本番ビルドが通ることを PR 前に確認することを推奨します

---

## 質問・相談

- バグ報告や機能要望は GitHub の Issue でお願いします
- 実装の詳細は、リポジトリ内の `.cursor/memory/`（アーキテクチャ・データフロー等）を参照しています。メンテナに質問がある場合は Issue や PR のコメントでどうぞ。
