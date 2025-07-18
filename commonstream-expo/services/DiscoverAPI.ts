import { SearchResult } from '@/types/Discover';
import { GROQ_CONFIG, GROQ_ERROR_MESSAGES } from '@/constants/Groq';

class DiscoverAPIError extends Error {
  code: string;
  status?: number;
  constructor(message: string, code: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class DiscoverService {
  /**
   * Validates Groq API config
   */
  private static validateConfig(): void {
    if (!GROQ_CONFIG.API_KEY) {
      throw new DiscoverAPIError(GROQ_ERROR_MESSAGES.API_KEY_MISSING, 'CONFIG_ERROR');
    }
  }

  /**
   * Makes a request to the Groq API for discovery
   */
  private static async makeRequest(prompt: string): Promise<any> {
    this.validateConfig();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GROQ_CONFIG.TIMEOUT);

    try {
      const response = await fetch(GROQ_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_CONFIG.MODELS.BALANCED,
          messages: [
            {
              role: 'system',
              content: `You are a music discovery AI. Return ONLY valid JSON for a search result with this structure:
{
  "id": "unique-id",
  "search_title": "Main title for the result (can be a song, album, artist, genre, or topic)",
  "search_subtitle": "Subtitle or secondary context (can be an artist, genre, era, or other relevant info)",
  "description": "A very verbose, informative, and detailed description. Include as much relevant information as possible about the query, including historical context, cultural impact, and why it is significant or interesting. The description should be several sentences long and provide unique insights, not just a summary.",
  "trackSuggestions": [
    { "artist": "Artist", "title": "Track Title", "reasoning": "Why suggested" }
    // At least 10 tracks must be included in this array
  ],
  "relevantLinks": [
    { "url": "https://...", "type": "official" }
  ]
}
The search_title and search_subtitle fields should be contextually appropriate: for example, if the query is about a genre, search_title could be the genre and search_subtitle could be a key artist or era. Do not always assume the result is a song by an artist. The UI should not always display them as 'title by subtitle'—they may represent broader or different contexts. The trackSuggestions array must contain at least 10 tracks, each with a unique and relevant reasoning. No extra text or formatting. The response should be as verbose and informative as possible, especially in the description field.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: GROQ_CONFIG.MAX_TOKENS,
          temperature: GROQ_CONFIG.TEMPERATURE,
          stream: false
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new DiscoverAPIError(
          `API request failed: ${response.status} ${response.statusText}`,
          'API_ERROR',
          response.status
        );
      }

      const data = await response.json();
      return data;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new DiscoverAPIError(GROQ_ERROR_MESSAGES.TIMEOUT, 'TIMEOUT');
      }
      if (error instanceof DiscoverAPIError) throw error;
      throw new DiscoverAPIError(GROQ_ERROR_MESSAGES.NETWORK_ERROR, 'NETWORK_ERROR');
    }
  }

  /**
   * Parses the Groq API response into a SearchResult
   */
  private static parseSearchResult(content: string): SearchResult {
    try {
      let cleanContent = content.trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanContent = jsonMatch[0];
      const parsed = JSON.parse(cleanContent);

      // Basic validation
      if (!parsed.id || !parsed.search_title || !parsed.search_subtitle) {
        throw new Error('Missing required fields in search result');
      }
      return parsed as SearchResult;
    } catch (error) {
      console.error('Failed to parse search result:', error);
      throw new DiscoverAPIError(GROQ_ERROR_MESSAGES.PARSE_ERROR, 'PARSE_ERROR');
    }
  }

  /**
   * Performs a discovery search using Groq API
   */
  public static async search(prompt: string): Promise<{ success: boolean; data?: SearchResult; error?: string; errorCode?: string }> {
    try {
      if (!prompt || prompt.trim().length === 0) {
        return { success: false, error: 'Prompt cannot be empty', errorCode: 'INVALID_INPUT' };
      }
      const response = await this.makeRequest(prompt);

      if (!response.choices || response.choices.length === 0) {
        return { success: false, error: GROQ_ERROR_MESSAGES.INVALID_RESPONSE, errorCode: 'INVALID_RESPONSE' };
      }

      const aiContent = response.choices[0].message.content;
      const result = this.parseSearchResult(aiContent);

      return { success: true, data: result };
    } catch (error: any) {
      if (error instanceof DiscoverAPIError) {
        return { success: false, error: error.message, errorCode: error.code };
      }
      return { success: false, error: 'An unexpected error occurred', errorCode: 'UNKNOWN_ERROR' };
    }
  }
}