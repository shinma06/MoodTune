import { auth } from "@/auth"
import PageClient from "./PageClient"

/** アプリ全体のモックモード。未設定または "true" のとき true（ログイン不要・GPT/Spotify 未使用） */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false"

export default async function Page() {
  const session = USE_MOCK ? null : await auth()
  const isUnauthenticated = !USE_MOCK && !session

  return (
    <PageClient isUnauthenticated={isUnauthenticated} />
  )
}
