# Decision Log

## 重要な技術的決定とその理由（ADR）

### ADR-001: Next.js 15 App Router の採用

**決定**: Next.js 15 の App Router を使用
**理由**:

- Server Components によるパフォーマンス向上
- ファイルベースルーティングの簡潔さ
- Vercel との統合によるデプロイの容易さ

**影響**: 全てのページは`app/`ディレクトリに配置

---

### ADR-002: shadcn/ui コンポーネントライブラリの採用

**決定**: カスタム UI コンポーネントではなく shadcn/ui を使用
**理由**:

- カスタマイズ可能
- アクセシビリティ対応済み
- メンテナンス不要（コピー&ペースト方式）

**影響**: UI コンポーネントは`src/components/ui/`に配置、必要時のみ追加

---

### ADR-003: React Context API による状態管理

**決定**: Redux や Zustand ではなく、React Context API を使用
**理由**:

- 状態が比較的シンプル（天気データのみ）
- 追加の依存関係が不要
- 学習コストが低い

**影響**: `WeatherContext`で天気データを管理

---

### ADR-004: CSS アニメーションによる天気エフェクト

**決定**: Canvas API や WebGL ではなく、CSS アニメーションを使用
**理由**:

- パフォーマンスが良い
- 実装がシンプル
- メンテナンスが容易

**影響**: `globals.css`にアニメーション定義、`WeatherAnimation`コンポーネントで適用

---

### ADR-005: 固定の top 色による UI 視認性確保

**決定**: 全グラデーションに固定色（#FAFAFA）を最上部に追加
**理由**:

- 上部 UI（WeatherMonitor）の視認性を常に確保
- 全天気パターンでアイコンの視認性を保証
- シンプルな実装

**影響**: `BackgroundGradient`インターフェースに`top`プロパティ追加

---

### ADR-006: テストパネルのメイン UI 統合

**決定**: 開発専用ページを削除し、メイン UI 上にテストパネルを配置
**理由**:

- 実際の UI で直接テストできる
- 開発フローが簡潔
- デプロイ時に不要なページを削除する必要がない

**影響**: `WeatherTestPanel`コンポーネントをメイン UI に統合

---

### ADR-007: 選択時の自動適用

**決定**: 適用ボタンを削除し、選択時に即座に反映
**理由**:

- ユーザー体験の向上（1 タップで変更）
- 開発効率の向上

**影響**: `WeatherTestPanel`の実装を簡素化

---

### ADR-008: 時間帯判定のロジック

**決定**: 時間帯を 4 つに分類（朝: 6-9 時、昼: 9-17 時、夕方: 17-19 時、夜: その他）
**理由**:

- シンプルで理解しやすい
- 背景色の変化が明確

**影響**: `getTimeOfDay`関数の実装

---

### ADR-009: WeatherContext の単一ソース化（表示用天気・時間帯・暗さ）

**決定**: 背景・テキスト色・アニメーションの判定に使う値を Context で単一ソース化する
**理由**:

- 天気取得失敗/ローディング時や Mood Tuning 手動設定時の表示不整合を防ぐ
- `effectiveTimeOfDay`, `effectiveWeather`, `isDark`, `displayHour` を一箇所で管理し、全コンポーネントが同じ値を参照する

**影響**: `WeatherContext` に上記プロパティを追加。PlaylistExplorer, WeatherMonitor, WeatherTestPanel, WeatherAnimation が Context から取得

---

### ADR-010: Favorite Music パネルとジャンル選択の永続化

**決定**: ジャンル選択を localStorage で永続化。空配列は「永続化として無効」とし、読み込み時はデフォルト（J-POP）に修復する
**理由**:

- パネルで全解除したままリロードしても意図せず 0 件で起動しない
- セッション中は 0 件の選択も許可し、警告表示・パネル閉じ不可で UX を維持

**影響**: `isValidGenreArray` で空配列を invalid に。初回読み込み・他タブ変更時のみ修復

---

### ADR-011: useLocalStorage の同一ページ内変更では無効値を修復しない

**決定**: 同一ページ内のストレージ変更イベントでは、バリデーションに失敗する値（例: 空配列）もそのまま state に反映し、ストレージを上書き修復しない
**理由**:

- ユーザーが「選択解除」や最後の 1 つを外して 0 件にした直後に、修復で即座にデフォルトに戻ると UX が悪い
- 初回読み込み・他タブ変更時のみ修復すれば、意図しない 0 件永続化は防げる

**影響**: `useLocalStorage` の `handleStorageChange` で `parsed === null && raw !== null` のとき `JSON.parse(raw)` を state に設定

---

### ADR-012: ジャンル変更時のプレイリスト更新は差分のみ API 呼び出し

**決定**: Favorite Music パネルを閉じたとき、追加されたジャンル分だけ `generateDashboard` を呼び、既存ジャンルは現在のプレイリストを再利用する
**理由**:

- 全件再生成だと不要な API 呼び出しとローディングが増える
- 追加ジャンルのみ生成して既存とマージすれば効率的

**影響**: `updatePlaylistsWithDiff`, `getGenresDiff` で差分計算。Mood Tuning 閉じ時は全件再生成（天気・時間が変わるため）

---

### ADR-013: レコード右 3 周・左 3 周で個別/全件再生成

**決定**: レコードを右に 3 周以上回したら表示中ジャンル単体を再生成、左に 3 周以上で全件再生成。通常のスワイプ（45°）では next/prev のみ
**理由**:

- ジェスチャーで「このジャンルだけやり直したい」「全部やり直したい」を直感的に実行できる
- 誤操作を防ぐため 3 周という閾値を設ける

**影響**: `useVinylRotation` の `onRegenerateCurrent`, `onRegenerateAll`。PlaylistExplorer で `refreshPlaylistByGenre`, `refreshPlaylists` に接続

---

### ADR-014: 都市名取得に Google Geocoding API（逆ジオコーディング）を採用

**決定**: 天気モニターの都市名表示に、緯度経度から地名を取得する Google Geocoding API（逆ジオコーディング）を使用する。取得失敗・空の場合は OpenWeatherMap の `name` にフォールバックする
**理由**:

- より正確でローカルな地名表示（市区町村レベル）が可能
- 天気 API と並列取得することでレイテンシを増やさない
- 本番では API キーのウェブサイト制限に対応するため Referer を送信、開発では送らない

**影響**: `GET /api/geocode` を新設。`weather-api.ts` で天気と Geocoding を `Promise.all` で並列取得。表示は最もローカルな地名のみ（locality > administrative_area_level_2 > level_1）
