// Groq API Types
export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatRequest {
  model: string;
  messages: GroqChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface GroqChatChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChatChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Playlist Generation Types
export interface UserPreferences {
  genres?: string[];
  energy?: 'low' | 'medium' | 'high';
  mood?: string;
  decade?: string;
  explicit?: boolean;
  maxTracks?: number;
}

export interface SuggestedTrack {
  artist: string;
  title: string;
  reasoning?: string;
}

export interface FindResult {
  answer: string;
  context: string;
  reasoning?: string;
}

export interface GeneratedPlaylist {
  name: string;
  description: string;
  tracks: SuggestedTrack[];
}

export interface GeneratedFind {
  name: string;
  description: string;
  tracks: SuggestedTrack[];
}

export interface PlaylistGenerationRequest {
  prompt: string;
  preferences?: UserPreferences;
}

export interface FindGenerationRequest {
  prompt: string;
  preferences?: UserPreferences;
}

// Service Response Types
export interface GroqServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export interface PlaylistGenerationResponse extends GroqServiceResponse<GeneratedPlaylist> {}
export interface FindGenerationResponse extends GroqServiceResponse<FindResult[]> {}
export interface ReferenceGenerationResponse extends GroqServiceResponse<ReferenceResult[]> {}

// Error Types
export class GroqAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'GroqAPIError';
  }
}

export class PlaylistParseError extends Error {
  constructor(message: string, public rawResponse?: string) {
    super(message);
    this.name = 'PlaylistParseError';
  }
}

export class FindParseError extends Error {
  constructor(message: string, public rawResponse?: string) {
    super(message);
    this.name = 'FindParseError';
  }
}

// =================== REFERENCE =================================

export interface ReferenceResult {
  relation: 'sampled_in' | 'samples' | 'soundtrack_in';
  work_title: string;
  work_type: 'song' | 'film' | 'tv' | 'game' | 'ad' | 'trailer' | 'other';
  work_artist_or_credit: string;
  note: string;
  evidence_url: string;
  evidence_source: string;
  year?: string;
  timestamp?: string;
  episode?: string;
  reasoning?: string;
}

export interface ReferenceGenerationRequest {
  prompt: string;
  preferences?: UserPreferences;
}

export class ReferenceParseError extends Error {
  constructor(message: string, public rawResponse?: string) {
    super(message);
    this.name = 'ReferenceParseError';
  }
}


// =================== MUSO TYPES (rewritten to match {code,result,data}) ===================

// Common primitives
export type MusoEntityType = 'profile' | 'organization' | 'album' | 'track';

export interface MusoImage {
  url: string;
  width?: number;
  height?: number;
}

export interface MusoExternalURL {
  label?: string;                  // e.g., "muso", "spotify", "apple_music"
  url: string;
}

export interface MusoLinks {
  web?: string;                    // e.g., canonical web page
  homepage?: string;
  [key: string]: unknown;
}

export interface MusoBaseEntity {
  id: string;                      // Muso internal id or stable handle
  type: MusoEntityType;
  name: string;
  href?: string;                   // canonical Muso web URL, if present
  images?: MusoImage[];

  // Providers may return any of these URL variants
  external_urls?: MusoExternalURL[];
  externalUrls?: MusoExternalURL[];
  links?: MusoLinks;

  // Allow forward-compat
  [key: string]: unknown;
}

// Entity variants
export interface MusoProfile extends MusoBaseEntity {
  type: 'profile';
  roles?: Array<string | { name?: string }>; // accept "producer" or {name:"producer"}
  country?: string;
}

export interface MusoOrganization extends MusoBaseEntity {
  type: 'organization';
  org_type?: 'label' | 'publisher' | 'studio' | 'collective' | 'other';
}

export interface MusoAlbum extends MusoBaseEntity {
  type: 'album';
  artists?: Array<Pick<MusoProfile, 'id' | 'name'>>;
  release_date?: string;           // ISO or year-only
  releaseDate?: string;            // provider alt
  upc?: string;
}

export interface MusoTrack extends MusoBaseEntity {
  type: 'track';
  artists?: Array<Pick<MusoProfile, 'id' | 'name'>>;
  artist?: string;                 // sometimes single field
  album?: Pick<MusoAlbum, 'id' | 'name'>;
  isrc?: string;
  duration_ms?: number;
  preview_url?: string;
}

// Union for a single item
export type MusoResult = MusoProfile | MusoOrganization | MusoAlbum | MusoTrack;

// Paged section
export interface MusoSection<T extends MusoResult = MusoResult> {
  items: T[];
  total: number;
}

// ---- What the API returns in your logs ----
// Top-level envelope
export interface MusoSearchEnvelope {
  code: number;                    // e.g., 200
  result: string;                  // e.g., "ok"
  data: MusoSearchData;
  // Leave room for future fields
  [key: string]: unknown;
}

// data payload
export interface MusoSearchData {
  profiles:       MusoSection<MusoProfile>;
  organizations:  MusoSection<MusoOrganization>;
  albums:         MusoSection<MusoAlbum>;
  tracks:         MusoSection<MusoTrack>;

  // Optional pagination echoes if added by provider later
  next_page_token?: string;
  prev_page_token?: string;
  query?: string;
  [key: string]: unknown;
}

// For convenience in your component props
export type MusoSearchResponse = MusoSearchEnvelope;

// ---------------- Request ----------------
export const MUSO_TYPES = ['profile', 'album', 'track', 'organization'] as const;
export type MusoType = (typeof MUSO_TYPES)[number];

export interface MusoSearchRequest {
  keyword: string;                 // REQUIRED by /search
  type: MusoType[];                // e.g., ["profile","track"]
  childCredits?: string[];         // e.g., ["Composer","Producer"]
  limit?: number;                  // 1..50
  offset?: number;                 // >= 0
  releaseDateStart?: string;       // "YYYY-MM-DD"
  releaseDateEnd?: string;         // "YYYY-MM-DD"
}

// ---------------- Result wrapper ----------------
// If you use a common service response wrapper:
export interface MusoGenerationResponse extends GroqServiceResponse<MusoSearchEnvelope> {}

// ---------------- Type guards ----------------
export const isMusoProfile = (x: MusoResult): x is MusoProfile => x?.type === 'profile';
export const isMusoOrganization = (x: MusoResult): x is MusoOrganization => x?.type === 'organization';
export const isMusoAlbum = (x: MusoResult): x is MusoAlbum => x?.type === 'album';
export const isMusoTrack = (x: MusoResult): x is MusoTrack => x?.type === 'track';

// Optional parse error class
export class MusoParseError extends Error {
  constructor(message: string, public rawResponse?: string) {
    super(message);
    this.name = 'MusoParseError';
  }
}
