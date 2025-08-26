// MusoAPI.ts
import { MusoSearchRequest, MusoSearchResponse } from '../types/Groq';
import { MUSO_CONFIG } from '@/constants/Muso';

const MUSO_BASE_URL = MUSO_CONFIG.API_URL; // confirm base URL in docs

export class MusoService {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('Muso API key is required');
    this.apiKey = apiKey;
  }

  /**
   * Generic request handler for Muso API
   */
  private async makeRequest<T>(endpoint: string, body: object): Promise<T> {
    try {
      const response = await fetch(`${MUSO_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Muso API error: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (err) {
      console.error(`MusoService request to ${endpoint} failed:`, err);
      throw err;
    }
  }

  /**
   * Perform a search across profiles, albums, tracks, or organizations
   */
  async search(request: MusoSearchRequest): Promise<MusoSearchResponse> {
    return this.makeRequest<MusoSearchResponse>('/search', request);
  }
}
