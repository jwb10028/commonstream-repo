export type QueryType = 'genre' | 'track' | 'artist';

export interface ConnectQuery {
  type: QueryType;
  value: string | Record<string, any>;
}

export interface RelevantLink {
  url: string;
  type: 'official' | 'streaming' | 'social';
}

export interface ConnectNode {
  title: string;
  cover_image: string;
  date_range: string;
  description: string;
  relevantLinks: RelevantLink[];
}

export interface ConnectResult {
  nodes: ConnectNode[];
  query: ConnectQuery;
}