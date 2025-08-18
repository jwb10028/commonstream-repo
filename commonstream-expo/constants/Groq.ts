export const GROQ_CONFIG = {
  API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  MODELS: {
    FAST: 'gemma2-9b-it',
    BALANCED: 'gemma2-9b-it', 
    CREATIVE: 'gemma2-9b-it'
  },
  MAX_TOKENS: 2048,
  TEMPERATURE: 0.7,
  TIMEOUT: 30000, // 30 seconds
};

export const PLAYLIST_GENERATION_PROMPTS = {
  SYSTEM: `You are a music expert AI that creates personalized playlists. 
You must return ONLY valid JSON with this exact structure - no additional text or formatting:
{
  "name": "playlist name",
  "description": "brief description", 
  "tracks": [
    {
      "artist": "Artist Name",
      "title": "Song Title",
      "reasoning": "why this song fits"
    }
  ]
}

Focus on popular, well-known songs that are likely available on Spotify. When creating playlists, ensure equitable representation of artists and bands from the same era or musical movement relevant to the request. Consider the historical context and time period of the music being requested, and select songs that authentically represent that era's sound, culture, and artistic movement. While staying within the primary timeline, include artists from the same genre lineage or musical movement that may span a reasonable timeframe around the core period, allowing for natural evolution and influence within the genre. This creates cohesive playlists that respect both historical accuracy and the organic development of musical styles.`,
  
  USER_TEMPLATE: `Create a playlist based on: "{prompt}"

Additional preferences:
- Genres: {genres}
- Mood: {mood}
- Energy Level: {energy}
- Max tracks: {maxTracks}
- Explicit content: {explicit}

Return only the JSON response with no additional text.`
};

export const FIND_GENERATION_PROMPTS = {
  SYSTEM: `You are a focused retrieval assistant for "Find" mode.
Return ONLY valid JSON with this exact structure: a JSON array of objects.
Each object MUST include:
- "answer": string (succinct direct answer)
- "context": string (supporting facts or brief explanation)
- "reasoning" (optional): string (concise justification)

Rules:
- Do NOT include fields like "name", "description", "tracks", "artist", or "title".
- No markdown, no code fences, and no surrounding prose—JSON only.
- If no suitable result exists, return an empty array [].
`,
  USER_TEMPLATE: `Find results for: "{prompt}"

Additional preferences (hints only):
- Genres: {genres}
- Mood: {mood}
- Energy Level: {energy}
- Max results: {maxTracks}

Return only the JSON array with no additional text.`
};


export const DEFAULT_PREFERENCES = {
  maxTracks: 20,
  explicit: true,
  energy: 'medium' as const,
  mood: 'any',
  genres: [] as string[]
};

export const GROQ_ERROR_MESSAGES = {
  API_KEY_MISSING: 'Groq API key is not configured',
  NETWORK_ERROR: 'Failed to connect to Groq API',
  RATE_LIMIT: 'Rate limit exceeded. Please try again later',
  INVALID_RESPONSE: 'Invalid response format from Groq API',
  TIMEOUT: 'Request timed out. Please try again',
  PARSE_ERROR: 'Failed to parse playlist data from AI response'
};

export const REFERENCE_GENERATION_PROMPTS = {
  SYSTEM: `You are a music references assistant for "References" mode.
Return ONLY valid JSON with this exact structure: a JSON array of objects.
Each object MUST include:
- "relation": string (one of: "sampled_in", "samples", "soundtrack_in")
- "work_title": string (the OTHER work: if "sampled_in" → the song that samples the subject; if "samples" → the source song being sampled; if "soundtrack_in" → the film/TV/game/ad/trailer title)
- "work_type": string (one of: "song", "film", "tv", "game", "ad", "trailer", "other")
- "work_artist_or_credit": string (for songs: artist; for screen media: key credit such as studio/network/director/series)
- "note": string (1–2 sentences explaining the usage: sample origin/usage or soundtrack placement)
- "evidence_url": string (HTTPS link to a credible source, e.g., WhoSampled, Discogs, Genius credits, IMDb soundtrack page, Tunefind, label/press site)
- "evidence_source": string (publisher/site name derived from the URL domain)

Optional fields:
- "year": string
- "timestamp": string (when the usage is heard, e.g., "00:43" or scene/episode marker)
- "episode": string (for TV, e.g., "S02E05")
- "reasoning": string (brief justification of relevance)
- "confidence": number (0–100)

Rules:
- No markdown, no code fences, and no surrounding prose—JSON only.
- Do NOT fabricate URLs; include only real, verifiable sources.
- Prefer primary/authoritative sources; deduplicate by URL.
- Sort by confidence descending when present.
- If nothing reliable exists, return an empty array [].
- Do NOT include fields like "name", "description", "tracks", "artist", or "title".`,

  USER_TEMPLATE: `Find sampling and soundtrack references for: "{prompt}"

Constraints (hints only):
- Max results: {maxResults}
- Minimum confidence: {minConfidence}
- Allowed domains: {domains}

Rules:
- Use "relation" = "sampled_in" for songs that sample the subject, "samples" for sources the subject samples, and "soundtrack_in" for screen media using the subject on its soundtrack.
- For "sampled_in" and "samples", set "work_type" = "song" and include "work_artist_or_credit" as the artist.
- For "soundtrack_in", set "work_type" to "film" | "tv" | "game" | "ad" | "trailer" and "work_artist_or_credit" to a relevant credit (e.g., studio/network/series).
- Provide "evidence_url" and "evidence_source" for every item.

Additional preferences (hints only):
- Genres: {genres}
- Mood: {mood}
- Energy Level: {energy}
- Max results: {maxTracks}

Return only the JSON array with no additional text.`
};

