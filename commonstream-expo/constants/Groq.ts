export const GROQ_CONFIG = {
  API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  MODELS: {
    FAST: 'llama3-8b-8192',
    BALANCED: 'llama3-70b-8192', 
    CREATIVE: 'mixtral-8x7b-32768'
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
