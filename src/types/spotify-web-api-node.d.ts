declare module "spotify-web-api-node" {
  interface SpotifyWebApiOptions {
    clientId?: string
    clientSecret?: string
    redirectUri?: string
    accessToken?: string
    refreshToken?: string
  }

  interface SearchTracksOptions {
    limit?: number
    offset?: number
    market?: string
  }

  interface Track {
    id: string
    name: string
    album?: {
      images?: Array<{ url: string; height?: number; width?: number }>
    }
  }

  interface SearchTracksResponse {
    body: {
      tracks?: {
        items?: Track[]
      }
    }
  }

  class SpotifyWebApi {
    constructor(options?: SpotifyWebApiOptions)
    setAccessToken(token: string): void
    setRefreshToken(token: string): void
    searchTracks(
      query: string,
      options?: SearchTracksOptions
    ): Promise<SearchTracksResponse>
  }

  export default SpotifyWebApi
}
