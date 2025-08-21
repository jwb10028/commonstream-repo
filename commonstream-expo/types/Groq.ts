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


// =================== MUSO =================================

// Common primitives
export type MusoEntityType = 'profile' | 'organization' | 'album' | 'track';

export interface MusoImage {
  url: string;
  width?: number;
  height?: number;
}

export interface MusoExternalURL {
  label?: string;           // e.g., "muso", "spotify", "apple_music"
  url: string;
}

export interface MusoBaseEntity {
  id: string;               // Muso internal id or stable handle
  type: MusoEntityType;
  name: string;
  href?: string;            // canonical Muso web URL, if present
  images?: MusoImage[];
  external_urls?: MusoExternalURL[];
  // Provider may return additional fields—keep them
  [key: string]: unknown;
}

// Entity variants
export interface MusoProfile extends MusoBaseEntity {
  type: 'profile';
  roles?: string[];         // e.g., ["producer","engineer","composer"]
  country?: string;
}

export interface MusoOrganization extends MusoBaseEntity {
  type: 'organization';
  org_type?: 'label' | 'publisher' | 'studio' | 'collective' | 'other';
}

export interface MusoAlbum extends MusoBaseEntity {
  type: 'album';
  artists?: Array<Pick<MusoProfile, 'id' | 'name'>>;
  release_date?: string;    // ISO or year-only
  upc?: string;
}

export interface MusoTrack extends MusoBaseEntity {
  type: 'track';
  artists?: Array<Pick<MusoProfile, 'id' | 'name'>>;
  album?: Pick<MusoAlbum, 'id' | 'name'>;
  isrc?: string;
  duration_ms?: number;
  preview_url?: string;
}

// Union for a single item (handy for generic handling)
export type MusoResult = MusoProfile | MusoOrganization | MusoAlbum | MusoTrack;

// Section wrapper used in the success payload
export interface MusoSection<T extends MusoResult = MusoResult> {
  items: T[];               // Array of concrete entities
  total: number;            // Total count available (not just returned)
}

// Top-level search response envelope (mirrors the doc screenshot)
export interface MusoSearchResponse {
  profiles: MusoSection<MusoProfile>;
  organizations: MusoSection<MusoOrganization>;
  albums: MusoSection<MusoAlbum>;
  tracks: MusoSection<MusoTrack>;
  // If Muso adds pagination tokens or request echo fields later:
  next_page_token?: string;
  prev_page_token?: string;
  query?: string;
  [key: string]: unknown;
}

// Request you’ll build from the user prompt (what your Groq parser will produce)
export const MUSO_TYPES = ['profile', 'album', 'track', 'organization'] as const;
export type MusoType = (typeof MUSO_TYPES)[number];

export interface MusoSearchRequest {
  keyword: string;                // <-- REQUIRED by Muso /search
  type: MusoType[];               // ["profile","track",...]
  childCredits?: string[];        // e.g., ["Composer","Producer"]
  limit?: number;
  offset?: number;
  releaseDateStart?: string;      // "YYYY-MM-DD"
  releaseDateEnd?: string;        // "YYYY-MM-DD"
}
// Your service response wrapper (aligned to your pattern above)
export interface MusoGenerationResponse
  extends GroqServiceResponse<MusoSearchResponse> {}

// (Optional) Narrow type guards if you want runtime safety
export const isMusoProfile = (x: MusoResult): x is MusoProfile => x?.type === 'profile';
export const isMusoOrganization = (x: MusoResult): x is MusoOrganization => x?.type === 'organization';
export const isMusoAlbum = (x: MusoResult): x is MusoAlbum => x?.type === 'album';
export const isMusoTrack = (x: MusoResult): x is MusoTrack => x?.type === 'track';

// Fix the error name while we’re here
export class MusoParseError extends Error {
  constructor(message: string, public rawResponse?: string) {
    super(message);
    this.name = 'MusoParseError';
  }
}
