export interface JamendoResponse<T> {
  headers: {
    status: string;
    code: number;
    error_message: string;
    warnings: string;
    results_count: number;
  };
  results: T[];
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
