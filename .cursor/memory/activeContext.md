# Active Context

## 現在のセッションの焦点

Spotify API連携とモックモード対応の実装完了

## 最近の変更履歴

- Spotify認証の実装:
  - `src/auth.ts`: NextAuth v5 + Spotify Provider の設定
  - `src/lib/spotify-server.ts`: Spotify API クライアント初期化の共通化
  - `src/types/next-auth.d.ts`: Session/JWT型の拡張（accessToken, refreshToken, expiresAt）
  - `src/app/api/auth/[...nextauth]/route.ts`: 認証APIルート
- モックモード対応のダッシュボード生成:
  - `src/app/actions/generateDashboard.ts`: Server Actionでプレイリスト生成
  - AI SDK v5 (Vercel AI SDK) + OpenAI でタイトル・検索クエリを生成
  - モックモード時はLorem Picsumでダミー画像を返す
- ページとコンポーネントの更新:
  - `src/app/page.tsx`: ログインバイパス、初期データ生成の共通化
  - `src/components/PlaylistExplorer.tsx`: 動的データ対応、ローディング状態のUI追加
- リファクタリング:
  - `src/lib/constants.ts`: TIME_OF_DAY_LABELS を追加
  - `src/lib/weather-utils.ts`: normalizeWeatherType が null/undefined を受け入れるよう改善
  - 重複コードの排除（weatherLabel/timeLabelマッピング、初期データ生成ロジック）

## 現在の開発状態

- Spotify認証フローが実装済み
- モックモード（NEXT_PUBLIC_USE_MOCK_SPOTIFY=true）で開発可能
- AI生成によるプレイリスト提案機能が動作

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
