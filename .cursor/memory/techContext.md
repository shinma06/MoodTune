# Tech Context

## 使用技術の選定理由

### Next.js 15 (App Router)
- **理由**: 最新のReact Server Components、優れたパフォーマンス、Vercelとの統合
- **App Router採用**: ファイルベースルーティング、レイアウト、Server Componentsの利点を活用

### TypeScript
- **理由**: 型安全性、開発体験の向上、リファクタリングの容易さ
- **設定**: 厳格な型チェック、明示的な型定義を推奨

### Tailwind CSS 4.x
- **理由**: ユーティリティファースト、高速開発、カスタマイズ性
- **使用方針**: カスタムCSSは最小限、globals.cssはアニメーション定義のみ

### shadcn/ui
- **理由**: カスタマイズ可能、アクセシビリティ対応、Radix UIベース
- **使用方針**: 既存コンポーネントを優先、不足時は`npx shadcn@latest add`で追加

### OpenWeatherMap API
- **理由**: 無料プランあり、日本語対応、信頼性
- **実装**: Next.js API Routeでプロキシ（APIキー保護）

## 開発環境

### 必須環境変数
```
NEXT_PUBLIC_WEATHER_API_KEY=your_openweathermap_api_key
```

### 開発サーバー
```bash
npm run dev
```

### ビルド
```bash
npm run build
npm start
```

## 依存関係の管理
- **パッケージマネージャー**: npm
- **バージョン管理**: package-lock.json
- **shadcn/ui追加**: `npx shadcn@latest add [component] --yes`

## パフォーマンス考慮事項
- **アニメーション**: CSSアニメーションを優先（JavaScriptアニメーションは避ける）
- **画像最適化**: Next.js Imageコンポーネント使用（必要時）
- **コード分割**: Next.jsの自動コード分割を活用

## ブラウザサポート
- モダンブラウザ（Chrome, Firefox, Safari, Edge）
- モバイルブラウザ対応
- 位置情報API対応が必要

