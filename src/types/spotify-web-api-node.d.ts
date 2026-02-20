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
    uri: string
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

  interface UserProfile {
    id: string
    display_name?: string
    email?: string
  }

  interface Playlist {
    id: string
    name: string
    external_urls: { spotify: string }
  }

  interface UserPlaylistsOptions {
    limit?: number
    offset?: number
  }

  interface CreatePlaylistOptions {
    public?: boolean
    collaborative?: boolean
    description?: string
  }

  class SpotifyWebApi {
    constructor(options?: SpotifyWebApiOptions)
    setAccessToken(token: string): void
    setRefreshToken(token: string): void
    searchTracks(
      query: string,
      options?: SearchTracksOptions
    ): Promise<SearchTracksResponse>
    getMe(): Promise<{ body: UserProfile }>
    getUserPlaylists(
      userId: string,
      options?: UserPlaylistsOptions
    ): Promise<{ body: { items: Playlist[]; total: number } }>
    createPlaylist(
      name: string,
      options?: CreatePlaylistOptions
    ): Promise<{ body: Playlist }>
    changePlaylistDetails(
      playlistId: string,
      options: { name?: string; public?: boolean; description?: string }
    ): Promise<void>
    replaceTracksInPlaylist(
      playlistId: string,
      uris: string[]
    ): Promise<void>
    addTracksToPlaylist(
      playlistId: string,
      uris: string[]
    ): Promise<void>
  }

  export default SpotifyWebApi
}
