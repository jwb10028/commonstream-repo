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
