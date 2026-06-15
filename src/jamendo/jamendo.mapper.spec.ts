import {
  mapJamendoAlbum,
  mapJamendoAlbumWithTracks,
  mapJamendoArtist,
  mapJamendoPlaylistWithTracks,
  mapJamendoTrack,
} from './jamendo.mapper';

describe('Jamendo mappers', () => {
  it('normalizes tracks and hides disallowed download URLs', () => {
    expect(
      mapJamendoTrack({
        id: '1',
        name: 'Track',
        artist_id: 'artist-1',
        artist_name: 'Artist',
        album_id: '',
        album_name: '',
        duration: 123,
        image: '',
        album_image: 'https://img.test/album.jpg',
        audio: 'https://audio.test/track.mp3',
        audiodownload: 'https://download.test/track.mp3',
        audiodownload_allowed: false,
        shareurl: 'https://share.test/track',
        license_ccurl: '',
      }),
    ).toEqual({
      source: 'jamendo',
      sourceId: '1',
      title: 'Track',
      artist: 'Artist',
      artistId: 'artist-1',
      album: null,
      albumId: null,
      duration: 123,
      coverUrl: 'https://img.test/album.jpg',
      audioUrl: 'https://audio.test/track.mp3',
      downloadUrl: null,
      shareUrl: 'https://share.test/track',
      licenseUrl: null,
      audiodownloadAllowed: false,
    });
  });

  it('normalizes album fallbacks and ZIP permissions', () => {
    expect(
      mapJamendoAlbum({
        id: 'album-1',
        name: 'Album',
        artist_id: 'artist-1',
        artist_name: 'Artist',
        image: '',
        shorturl: 'https://short.test/album',
        zip: 'https://zip.test/album.zip',
        zip_allowed: false,
      }),
    ).toMatchObject({
      sourceId: 'album-1',
      coverUrl: null,
      zipUrl: null,
      shareUrl: 'https://short.test/album',
      zipAllowed: false,
      trackCount: null,
    });
  });

  it('normalizes album tracks with positions and license data', () => {
    expect(
      mapJamendoAlbumWithTracks({
        id: 'album-1',
        name: 'Album',
        artist_id: 'artist-1',
        artist_name: 'Artist',
        image: 'https://img.test/album.jpg',
        tracks: [
          {
            id: 'track-1',
            position: '2',
            name: 'Second',
            duration: '180',
            license_ccurl: 'https://license.test',
            audio: 'https://audio.test/2.mp3',
            audiodownload_allowed: true,
            audiodownload: 'https://download.test/2.mp3',
          },
        ],
      }),
    ).toMatchObject({
      sourceId: 'album-1',
      trackCount: 1,
      tracks: [
        {
          sourceId: 'track-1',
          position: 2,
          duration: 180,
          coverUrl: 'https://img.test/album.jpg',
          downloadUrl: 'https://download.test/2.mp3',
          licenseUrl: 'https://license.test',
        },
      ],
    });
  });

  it('normalizes artists and public playlist tracks with missing optional fields', () => {
    expect(
      mapJamendoArtist({
        id: 'artist-1',
        name: 'Artist',
      }),
    ).toEqual({
      source: 'jamendo',
      sourceId: 'artist-1',
      name: 'Artist',
      imageUrl: null,
      websiteUrl: null,
      joinDate: null,
      shareUrl: null,
    });

    expect(
      mapJamendoPlaylistWithTracks({
        id: 'playlist-1',
        name: 'Playlist',
        tracks_count: 10,
        tracks: [],
      }),
    ).toMatchObject({
      sourceId: 'playlist-1',
      author: null,
      trackCount: 0,
      tracks: [],
    });
  });
});
