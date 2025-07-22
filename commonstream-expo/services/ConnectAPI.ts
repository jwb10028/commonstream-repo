import { ConnectResult, ConnectQuery, ConnectNode, RelevantLink } from '@/types/Connect';
import { GROQ_CONFIG, GROQ_ERROR_MESSAGES } from '@/constants/Groq';

class ConnectAPIError extends Error {
  code: string;
  status?: number;
  constructor(message: string, code: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class ConnectService {
  /**
   * Validates Groq API config
   */
  private static validateConfig(): void {
    if (!GROQ_CONFIG.API_KEY) {
      throw new ConnectAPIError(GROQ_ERROR_MESSAGES.API_KEY_MISSING, 'CONFIG_ERROR');
    }
  }

  /**
   * Makes a request to the Groq API for connect nodes
   */
  private static async makeRequest(query: ConnectQuery): Promise<any> {
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
            content: `You are a music connect AI. Return ONLY valid JSON for a connect result with this structure:
{
  "nodes": [
    {
      "title": "Node Title",
      "cover_image": "https://...",
      "date_range": "YYYY-YYYY or era",
      "description": "Short description (max 15 words).",
      "relevantLinks": [
        { "url": "https://...", "type": "official" }
      ]
    }
    // 10 nodes in this array
  ],
  "query": { "type": "genre|track|artist", "value": "user input" }
}
The nodes array must contain exactly 10 nodes, each with unique and relevant information. Keep each node's description under 15 words. Do not include any extra text, comments, or formatting. Output only valid JSON.


Each node must have a unique cover_image that is visually different from the others. Do not use different URLs for the same image, and do not return any nodes with duplicate or visually similar cover_image values in the array.

If the query type is 'artist', recommend artists of similar popularity level to the input artist. Do NOT recommend artists who are significantly more popular or mainstream than the input artist (e.g., if the input is an indie artist, do not recommend major mainstream acts like Coldplay). Focus on artists with comparable audience size, recognition, or influence.

If the query type is 'track', recommend songs that are:
- Of similar genres and from artists within similar social circles or scenes as the input track's artist(s)
- Released around the same timeframe as the input track, OR
- Songs from the past that a listener who enjoys the input track would likely appreciate (e.g., influential or stylistically related older tracks).
Avoid recommending songs that are unrelated in genre, era, or artist community.`
            },
            {
              role: 'user',
              content: `Query type: ${query.type}, value: ${typeof query.value === 'object' ? JSON.stringify(query.value) : query.value}`
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
        throw new ConnectAPIError(
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
        throw new ConnectAPIError(GROQ_ERROR_MESSAGES.TIMEOUT, 'TIMEOUT');
      }
      if (error instanceof ConnectAPIError) throw error;
      throw new ConnectAPIError(GROQ_ERROR_MESSAGES.NETWORK_ERROR, 'NETWORK_ERROR');
    }
  }

  /**
   * Parses the Groq API response into a ConnectResult
   */
  private static parseConnectResult(content: string): ConnectResult {
    try {
      let cleanContent = content.trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanContent = jsonMatch[0];
      const parsed = JSON.parse(cleanContent);

      // Basic validation
      if (!parsed.nodes || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
        throw new Error('Missing or invalid nodes array in connect result');
      }
      return parsed as ConnectResult;
    } catch (error) {
      console.error('Failed to parse connect result:', error);
      throw new ConnectAPIError(GROQ_ERROR_MESSAGES.PARSE_ERROR, 'PARSE_ERROR');
    }
  }

  /**
   * Performs a connect search using Groq API
   */
  public static async getNodes(query: ConnectQuery): Promise<{ success: boolean; data?: ConnectResult; error?: string; errorCode?: string }> {
    try {
      if (!query || !query.type || !query.value || (typeof query.value === 'string' && query.value.trim().length === 0)) {
        return { success: false, error: 'Query cannot be empty', errorCode: 'INVALID_INPUT' };
      }
      const response = await this.makeRequest(query);

      if (!response.choices || response.choices.length === 0) {
        return { success: false, error: GROQ_ERROR_MESSAGES.INVALID_RESPONSE, errorCode: 'INVALID_RESPONSE' };
      }

      const aiContent = response.choices[0].message.content;
      // Log the raw AI content for debugging
      console.log('[ConnectAPI] Raw Groq API response:', aiContent);
      const result = this.parseConnectResult(aiContent);

      return { success: true, data: result };
    } catch (error: any) {
      if (error instanceof ConnectAPIError) {
        return { success: false, error: error.message, errorCode: error.code };
      }
      return { success: false, error: 'An unexpected error occurred', errorCode: 'UNKNOWN_ERROR' };
    }
  }

    /**
   * Driver function to get a complete list of 50 unique nodes by calling getNodes multiple times.
   */
  public static async getCompleteNodes(query: ConnectQuery): Promise<{ success: boolean; data?: ConnectResult; error?: string; errorCode?: string }> {
    const allNodes: ConnectNode[] = [];
    const seenTitles = new Set<string>();
    let attempts = 0;
    const maxAttempts = 10; // Avoid infinite loops if the API fails
    while (allNodes.length < 30 && attempts < maxAttempts) {
      const result = await this.getNodes(query);
      attempts++;
      if (!result.success || !result.data || !result.data.nodes) {
        // Silently skip failed batch (including 429)
        continue;
      }
      // Add only unique nodes by title
      for (const node of result.data.nodes) {
        if (allNodes.length >= 30) break;
        if (!seenTitles.has(node.title)) {
          allNodes.push(node);
          seenTitles.add(node.title);
        }
      }
    }
    // Always return what we have, even if less than 30
    return { success: true, data: { nodes: allNodes, query } };
  }
}
