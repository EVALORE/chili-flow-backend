import {
  JamendoAlbum,
  JamendoAlbumTrack,
  JamendoArtist,
  JamendoAutocompleteMatch,
  JamendoPlaylist,
  JamendoPlaylistTrack,
  JamendoTrack,
} from './jamendo.types';

export function mapJamendoTrack(track: JamendoTrack) {
  return {
    source: 'jamendo',
    sourceId: track.id,
    title: track.name,
    artist: track.artist_name,
    artistId: track.artist_id,
    album: track.album_name || null,
    albumId: track.album_id || null,
    duration: track.duration,
    coverUrl: track.image || track.album_image || null,
    audioUrl: track.audio,
    downloadUrl: track.audiodownload_allowed ? track.audiodownload : null,
    shareUrl: track.shareurl,
    licenseUrl: track.license_ccurl || null,
    audiodownloadAllowed: Boolean(track.audiodownload_allowed),
  };
}

export function mapJamendoAlbum(album: JamendoAlbum) {
  return {
    source: 'jamendo',
    sourceId: album.id,
    title: album.name,
    artist: album.artist_name,
    artistId: album.artist_id,
    releaseDate: album.releasedate || null,
    coverUrl: album.image || null,
    zipUrl: album.zip_allowed ? album.zip || null : null,
    shareUrl: album.shareurl || album.shorturl || null,
    zipAllowed: Boolean(album.zip_allowed),
    trackCount: null,
  };
}

export function mapJamendoAlbumWithTracks(album: JamendoAlbumTrack) {
  const tracks = album.tracks ?? [];

  return {
    ...mapJamendoAlbum(album),
    trackCount: tracks.length,
    tracks: tracks.map((track) => ({
      source: 'jamendo',
      sourceId: track.id,
      title: track.name,
      artist: album.artist_name,
      artistId: album.artist_id,
      album: album.name,
      albumId: album.id,
      position: Number(track.position ?? 0),
      duration: Number(track.duration),
      coverUrl: album.image || null,
      audioUrl: track.audio,
      downloadUrl: track.audiodownload_allowed
        ? track.audiodownload || null
        : null,
      shareUrl: album.shareurl || null,
      licenseUrl: track.license_ccurl || null,
      audiodownloadAllowed: Boolean(track.audiodownload_allowed),
    })),
  };
}

export function mapJamendoArtist(artist: JamendoArtist) {
  return {
    source: 'jamendo',
    sourceId: artist.id,
    name: artist.name,
    imageUrl: artist.image || null,
    websiteUrl: artist.website || null,
    joinDate: artist.joindate || null,
    shareUrl: artist.shareurl || artist.shorturl || null,
  };
}

export function mapJamendoAutocompleteMatch(item: JamendoAutocompleteMatch) {
  return {
    label: item.match,
    count: item.count ?? null,
  };
}

export function mapJamendoPlaylist(playlist: JamendoPlaylist) {
  return {
    source: 'jamendo',
    sourceId: playlist.id,
    title: playlist.name,
    author: playlist.user_name || null,
    authorId: playlist.user_id || null,
    coverUrl: playlist.image || null,
    shareUrl: playlist.shareurl || playlist.shorturl || null,
    createdAt: playlist.creationdate || null,
    trackCount: playlist.tracks_count ?? null,
  };
}

export function mapJamendoPlaylistWithTracks(playlist: JamendoPlaylistTrack) {
  const tracks = playlist.tracks ?? [];

  return {
    ...mapJamendoPlaylist(playlist),
    trackCount: tracks.length,
    tracks: tracks.map(mapJamendoTrack),
  };
}
