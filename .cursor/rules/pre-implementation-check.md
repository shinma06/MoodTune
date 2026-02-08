# 実装前チェックリスト

## 目的

新機能の実装・既存機能の変更を行う前に、プロジェクト全体の機能連携を確認し、技術負債を残さないシンプルで効率的な設計を保つ。

## チェックリスト

### 1. 影響範囲の把握

- [ ] **データフローの確認**: この変更は `WeatherContext` / `useLocalStorage` / Server Action のどこに影響するか？
- [ ] **コンポーネント間連携**: 変更が他のコンポーネントの表示・動作に影響しないか？
  - `WeatherMonitor` ← → `WeatherContext` ← → `PlaylistExplorer`
  - `GenreSelector` ← → `useLocalStorage` ← → `PlaylistExplorer`
  - `WeatherMoodTuningPanel` ← → `WeatherContext` ← → 全コンポーネント
- [ ] **型の影響**: 新しい型を追加・変更する場合、`types/` 配下に集約されているか？既存型との整合性は？

### 2. 既存実装の確認

- [ ] **重複実装の回避**: 同様の処理が `lib/` や他のコンポーネントに既に存在しないか？
- [ ] **ユーティリティの再利用**: `weather-utils.ts`, `playlist-utils.ts`, `constants.ts` に使える関数・定数はないか？
- [ ] **Context の活用**: ローカル state で持つべきか、Context で管理すべきか？

### 3. シンプルさの検証

- [ ] **最小限のスコープ**: この変更で 1 つの責務だけを担っているか？複数の責務が混在していないか？
- [ ] **抽象化の必要性**: 本当に今この抽象化が必要か？YAGNI に反していないか？
- [ ] **静的 vs 動的**: 入力→出力が決定的なら、静的テーブルで表現できないか？

### 4. 実装後の確認

- [ ] **動作確認**: 実際に動かして、期待通りの振る舞いになっているか？
- [ ] **副作用の確認**: 変更していないはずの機能が壊れていないか？（特に Context 連携）
- [ ] **リファクタリングの検討**: より簡潔に書き直せる箇所はないか？

## プロジェクト固有の連携ポイント

### WeatherContext の責務

```
actualWeatherType / actualTimeOfDay  → 実際の天気・時間帯
weatherType / moodTuningTimeOfDay    → Mood Tuning で設定した値（Context）
effectiveWeather / effectiveTimeOfDay → 表示用（test があればそちら優先）
isDark                               → 背景が暗いかどうか
displayHour                          → 表示用時刻（1分ごと更新）
playlistRefreshTrigger               → プレイリスト再生成のトリガー
```

### useLocalStorage（selected-genres）の責務

```
- 永続化: localStorage に保存
- バリデーション: 空配列は「永続化として無効」
- 修復: 初回読み込み・他タブ変更時に無効値を検出したらデフォルトに修復
- 同一ページ内変更: 無効値もそのまま state に反映（修復しない）
```

### PlaylistExplorer のデータフロー

```
1. Context から effectiveWeather / effectiveTimeOfDay / isDark を取得
2. useSelectedGenres から現在のジャンル配列を取得
3. ジャンル差分・天気変化を検知してプレイリスト更新
4. 差分更新（追加ジャンルのみ API）/ 全件更新（Mood Tuning 閉じ時）
```

## 使い方

1. 実装を始める前にこのチェックリストを一読する
2. 不明点があれば `systemPatterns.md` / `activeContext.md` を参照
3. 実装後、「4. 実装後の確認」を行う
4. 技術負債を感じたら `rules/refactor-overcomplexity.md` を適用
