/** ダッシュボードのプレイリスト項目 */
export interface DashboardItem {
  id: string
  genre: string
  title: string
  imageUrl: string
  trackUris: string[]
}
