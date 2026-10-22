export interface RadioStation {
  changeuuid?: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage?: string;
  favicon?: string;
  tags?: string;
  country?: string;
  countrycode?: string;
  state?: string;
  language?: string;
  languagecodes?: string;
  votes?: number;
  lastchangetime?: string;
  codec?: string;
  bitrate?: number;
  hls?: number;
  lastcheckok?: number;
  lastchecktime?: string;
  lastcheckoktime?: string;
  lastlocalchecktime?: string;
  clicktimestamp?: string;
  clickcount?: number;
  clicktrend?: number;
  ssl_error?: number;
  geo_lat?: number | null;
  geo_long?: number | null;
  has_extended_info?: boolean;
}

export interface QuickFilterPreset {
  id: string;
  label: string;
  query: Record<string, string>;
}
