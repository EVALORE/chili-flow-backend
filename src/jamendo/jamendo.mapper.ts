import { JamendoTrack } from './Jamendo.types';

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
