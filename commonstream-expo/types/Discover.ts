export interface SearchResult {
  id: string;
  search_title: string;
  search_subtitle: string;
  description?: string;
  trackSuggestions: SuggestedTrack[];
  relevantLinks: RelevantLink[];
}

export interface SuggestedTrack {
  artist: string;
  title: string;
  reasoning?: string;
}

export interface RelevantLink {
  url: string;
  type: 'official' | 'streaming' | 'social';
}