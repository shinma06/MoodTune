import { auth } from "@/auth"
import PageClient from "./PageClient"

export default async function Page() {
  const session = await auth()
  const isUnauthenticated = !session

  return (
    <PageClient isUnauthenticated={isUnauthenticated} />
  )
}
