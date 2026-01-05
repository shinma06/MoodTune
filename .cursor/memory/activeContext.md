# Active Context

## 現在のセッションの焦点

リファクタリング完了 - コードの整理と構造改善

## 最近の変更履歴

- Memory Bank と.cursorrules の構築完了
- 定数の集約: `src/lib/constants.ts`に天気タイプと時間帯オプションを集約
- プレイリストデータの分離: `src/lib/playlists.ts`に移動
- グラデーション背景生成の共通化: `src/lib/weather-background-utils.ts`にユーティリティ関数を追加
- カスタムフックの作成:
  - `src/hooks/useVinylRotation.ts`: レコード盤の回転操作を管理
  - `src/hooks/useGeolocation.ts`: 位置情報取得を管理
- PlaylistExplorer の大幅な簡素化（約 150 行削減）
- WeatherMonitor の位置情報取得ロジックの共通化

## 現在の開発状態

- 基本機能は実装済み
- コードの可読性と保守性が向上
- 重複コードを排除し、DRY 原則を適用
- カスタムフックによる関心の分離を実現

## 次の優先事項

- パフォーマンス最適化の検討
- 追加機能の実装（必要に応じて）
