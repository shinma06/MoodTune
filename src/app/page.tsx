import { auth, signIn } from "@/auth"
import PageClient from "./PageClient"

/** Spotify 未連携時は true。明示的に "false" でない限りモック（ログイン不要） */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_SPOTIFY !== "false"

export default async function Page() {
  const session = USE_MOCK ? null : await auth()
  const isUnauthenticated = !USE_MOCK && !session

  const loginAction = async () => {
    "use server"
    await signIn("spotify")
  }

  return (
    <PageClient isUnauthenticated={isUnauthenticated} loginAction={loginAction} />
  )
}
