export interface JamendoResponse<TResults> {
  headers: {
    status: string;
    code: number;
    error_message: string;
    warnings: string;
    results_count: number;
  };
  results: TResults;
}

export interface JamendoTrack {
  id: string;
  name: string;
  artist_id: string;
  artist_name: string;
  album_id?: string;
  album_name?: string;
  album_image?: string;
  image?: string;
  duration: number;
  audio: string;
  audiodownload?: string;
  audiodownload_allowed?: boolean;
  shareurl: string;
  license_ccurl?: string;
}

export interface JamendoAlbum {
  id: string;
  name: string;
  releasedate?: string;
  artist_id: string;
  artist_name: string;
  image?: string;
  zip?: string;
  shorturl?: string;
  shareurl?: string;
  zip_allowed?: boolean;
}

export interface JamendoAlbumTrack extends JamendoAlbum {
  tracks?: {
    id: string;
    position?: string | number;
    name: string;
    duration: string | number;
    license_ccurl?: string;
    audio: string;
    audiodownload?: string;
    audiodownload_allowed?: boolean;
  }[];
}

export interface JamendoArtist {
  id: string;
  name: string;
  website?: string;
  joindate?: string;
  image?: string;
  shorturl?: string;
  shareurl?: string;
}

export interface JamendoAutocompleteMatch {
  match: string;
  count?: number;
}

export interface JamendoAutocompleteResults {
  tracks?: JamendoAutocompleteMatch[];
  albums?: JamendoAutocompleteMatch[];
  artists?: JamendoAutocompleteMatch[];
  tags?: JamendoAutocompleteMatch[];
}
