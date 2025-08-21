import {
  GroqChatRequest,
  GroqChatResponse,
  GroqChatMessage,
  GeneratedPlaylist,
  PlaylistGenerationRequest,
  PlaylistGenerationResponse,
  UserPreferences,
  GroqAPIError,
  PlaylistParseError,
  FindGenerationRequest,
  FindGenerationResponse,
  FindResult,
  FindParseError,
  ReferenceResult,
  ReferenceParseError,
  ReferenceGenerationRequest,
  ReferenceGenerationResponse
} from '@/types/Groq';
import {
  GROQ_CONFIG,
  PLAYLIST_GENERATION_PROMPTS,
  FIND_GENERATION_PROMPTS,
  REFERENCE_GENERATION_PROMPTS,
  DEFAULT_PREFERENCES,
  GROQ_ERROR_MESSAGES
} from '@/constants/Groq';

import { MusoService } from '@/services/MusoAPI';
import {
  MusoSearchRequest,
  MusoSearchResponse,
  MusoGenerationResponse,
  MusoType,
  MUSO_TYPES
} from '@/types/Groq';

// Allowed enums per Muso docs
const isMusoType = (v: unknown): v is MusoType =>
  typeof v === 'string' && (MUSO_TYPES as readonly string[]).includes(v as MusoType);

// If you keep configs together, feel free to promote this to /constants
const MUSO_API_KEY =
  process.env.NEXT_PUBLIC_MUSO_API_KEY ||
  process.env.MUSO_API_KEY ||
  '';

export class GroqService {
  /**
   * Validates that the Groq API is properly configured
   */
  private static validateConfig(): void {
    if (!GROQ_CONFIG.API_KEY) {
      throw new GroqAPIError(
        GROQ_ERROR_MESSAGES.API_KEY_MISSING,
        "CONFIG_ERROR"
      );
    }
  }

  /**
   * Makes a request to the Groq API
   */
  private static async makeRequest(
    request: GroqChatRequest
  ): Promise<GroqChatResponse> {
    this.validateConfig();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GROQ_CONFIG.TIMEOUT);

    try {
      const response = await fetch(GROQ_CONFIG.API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_CONFIG.API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new GroqAPIError(
            GROQ_ERROR_MESSAGES.RATE_LIMIT,
            "RATE_LIMIT",
            response.status
          );
        }

        const errorText = await response.text();
        throw new GroqAPIError(
          `API request failed: ${response.status} ${response.statusText}`,
          "API_ERROR",
          response.status
        );
      }

      const data = await response.json();
      return data as GroqChatResponse;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new GroqAPIError(GROQ_ERROR_MESSAGES.TIMEOUT, "TIMEOUT");
      }

      if (error instanceof GroqAPIError) {
        throw error;
      }

      throw new GroqAPIError(
        GROQ_ERROR_MESSAGES.NETWORK_ERROR,
        "NETWORK_ERROR"
      );
    }
  }

  /**
   * Formats user prompt with preferences
   */
  private static formatPrompt(
    prompt: string,
    preferences: UserPreferences
  ): string {
    const prefs = { ...DEFAULT_PREFERENCES, ...preferences };

    return PLAYLIST_GENERATION_PROMPTS.USER_TEMPLATE.replace("{prompt}", prompt)
      .replace("{genres}", prefs.genres?.join(", ") || "any")
      .replace("{mood}", prefs.mood || "any")
      .replace("{energy}", prefs.energy || "medium")
      .replace("{maxTracks}", (prefs.maxTracks || 20).toString())
      .replace("{explicit}", prefs.explicit ? "allowed" : "not allowed");
  }

  /**
   * Formats user find prompt with preferences
   */
  private static formatFindPrompt(
    prompt: string,
    preferences: UserPreferences
  ): string {
    const prefs = { ...DEFAULT_PREFERENCES, ...preferences };
    const genres =
      prefs.genres && prefs.genres.length ? prefs.genres.join(", ") : "any";
    const mood = prefs.mood || "any";
    const energy = prefs.energy || "any";
    // Clamp max results to something reasonable for UI
    const maxResults = Math.max(
      1,
      Math.min(25, prefs.maxTracks ?? DEFAULT_PREFERENCES.maxTracks)
    );

    return FIND_GENERATION_PROMPTS.USER_TEMPLATE.replace(
      "{prompt}",
      prompt.trim()
    )
      .replace("{genres}", genres)
      .replace("{mood}", mood)
      .replace("{energy}", energy)
      .replace("{maxTracks}", String(maxResults));
  }

  /**
   * Formats user reference prompt with preferences
   */
  private static formatReferencePrompt(
    prompt: string,
    preferences: UserPreferences
  ): string {
    const prefs = { ...DEFAULT_PREFERENCES, ...preferences };
    const genres =
      prefs.genres && prefs.genres.length ? prefs.genres.join(", ") : "any";
    const mood = prefs.mood || "any";
    const energy = prefs.energy || "any";
    // Clamp max results to something reasonable for UI
    const maxResults = Math.max(
      1,
      Math.min(25, prefs.maxTracks ?? DEFAULT_PREFERENCES.maxTracks)
    );

    return REFERENCE_GENERATION_PROMPTS.USER_TEMPLATE.replace(
      "{prompt}",
      prompt.trim()
    )
      .replace("{genres}", genres)
      .replace("{mood}", mood)
      .replace("{energy}", energy)
      .replace("{maxTracks}", String(maxResults));
  }

  /**
   * Formats a minimal, schema-locked prompt for extracting a Muso /search payload.
   * Output must be *only* JSON with fields: keyword (string), type (array), childCredits (array).
   */
  private static formatMusoPrompt(
    prompt: string,
    preferences: UserPreferences = {}
  ): string {
    const base = prompt.trim();
    // You can fold preferences into defaults here if you want genre/role hints, etc.
    return [
      "You are a strict JSON compiler.",
      "From the user prompt, produce ONLY a JSON object (no prose, no markdown fences).",
      "Schema:",
      '{ "keyword": string, "type": ["profile"|"album"|"track"|"organization"], "childCredits": string[] }',
      "Rules:",
      "- keyword: concise search string for Muso.",
      "- type: choose one or more entity types relevant to the query.",
      '- childCredits: zero or more credit roles to filter (e.g., "Composer", "Producer", "Mix Engineer").',
      "- Do not include extra keys. Do not include comments.",
      "",
      `User prompt: ${base}`,
    ].join("\n");
  }

  /**
   * Parses the AI response into a structured playlist
   */
  private static parsePlaylistResponse(content: string): GeneratedPlaylist {
    try {
      // Clean the response - remove any markdown formatting or extra text
      let cleanContent = content.trim();

      // Find JSON content if wrapped in markdown or other text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

      const parsed = JSON.parse(cleanContent);

      // Validate required fields
      if (
        !parsed.name ||
        !parsed.description ||
        !Array.isArray(parsed.tracks)
      ) {
        throw new Error("Missing required fields in response");
      }

      // Validate track structure
      for (const track of parsed.tracks) {
        if (!track.artist || !track.title) {
          throw new Error("Invalid track structure in response");
        }
      }

      return parsed as GeneratedPlaylist;
    } catch (error: unknown) {
      console.error("Failed to parse playlist response:", error);
      console.error("Raw response:", content);

      throw new PlaylistParseError(GROQ_ERROR_MESSAGES.PARSE_ERROR, content);
    }
  }

  /**
   * Parses the AI response into a find result
   */
  private static parseFindResponse(content: string): FindResult[] {
    try {
      let clean = content.trim();
      const jsonArray = clean.match(/\[[\s\S]*\]/); // prefer array if wrapped
      if (jsonArray) clean = jsonArray[0];

      const parsed = JSON.parse(clean);

      if (!Array.isArray(parsed)) {
        throw new Error("Response is not an array");
      }

      parsed.forEach((r: any) => {
        if (typeof r.answer !== "string" || typeof r.context !== "string") {
          throw new Error("Missing required fields: answer/context");
        }
        if (r.reasoning != null && typeof r.reasoning !== "string") {
          throw new Error("Invalid reasoning field");
        }
      });

      return parsed as FindResult[];
    } catch (err) {
      console.error("Failed to parse find response:", err);
      console.error("Raw response:", content);
      throw new FindParseError(GROQ_ERROR_MESSAGES.PARSE_ERROR, content);
    }
  }

  /**
   * Parses the AI response into a reference result
   */
  private static parseReferenceResponse(content: string): ReferenceResult[] {
    try {
      // --- minimal sanitize ---
      let s = content.trim();
      // strip ```json fences
      s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      // keep only the first JSON array if wrapped in prose
      const arr = s.match(/\[[\s\S]*\]/);
      if (arr) s = arr[0];
      // normalize smart quotes
      s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
      // fix common: missing comma between a string value and the next key on a new line
      // e.g.  ..."note": "foo"\n  "evidence_url": "..."
      s = s.replace(/"(\s*\n\s*")/g, '",$1');
      // remove trailing commas before } or ]
      s = s.replace(/,\s*([}\]])/g, "$1");

      const parsed = JSON.parse(s);
      if (!Array.isArray(parsed)) {
        throw new Error("Response is not an array");
      }

      // --- minimal validation ---
      parsed.forEach((r: any, i: number) => {
        if (
          typeof r?.relation !== "string" ||
          typeof r?.work_title !== "string" ||
          typeof r?.work_type !== "string" ||
          typeof r?.work_artist_or_credit !== "string" ||
          typeof r?.note !== "string" ||
          typeof r?.evidence_url !== "string" ||
          typeof r?.evidence_source !== "string"
        ) {
          throw new Error(`Item ${i} missing required fields`);
        }
      });

      return parsed as ReferenceResult[];
    } catch (err) {
      console.error("Failed to parse reference response:", err);
      console.error("Raw response:", content);
      throw new ReferenceParseError(GROQ_ERROR_MESSAGES.PARSE_ERROR, content);
    }
  }

  /**
   * Parses Groq output into a valid MusoSearchRequest.
   * Tolerant to code fences and prose; validates and normalizes fields.
   */
  private static parseMusoResponse(content: string): MusoSearchRequest {
    try {
      let s = content.trim();
      // strip ```json fences
      s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      // keep the first {...} if wrapped with prose
      const firstObj = s.match(/\{[\s\S]*\}/);
      if (firstObj) s = firstObj[0];

      const parsed: unknown = JSON.parse(s);

      // Narrow to record
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Not an object");
      }
      const obj = parsed as Record<string, unknown>;

      // keyword
      if (typeof obj.keyword !== "string" || obj.keyword.trim().length === 0) {
        throw new Error('Missing or invalid "keyword"');
      }
      const keyword = obj.keyword.trim();

      // type
      if (!Array.isArray(obj.type) || obj.type.length === 0) {
        throw new Error('Missing or invalid "type"');
      }
      const type: MusoType[] = (obj.type as unknown[]).map(
        (t: unknown): MusoType => {
          const lower = String(t).toLowerCase();
          if (!isMusoType(lower)) throw new Error(`Invalid type: ${t}`);
          return lower;
        }
      );

      // childCredits (optional)
      let childCredits: string[] | undefined;
      if (obj.childCredits != null) {
        if (!Array.isArray(obj.childCredits)) {
          throw new Error('Invalid "childCredits" (must be an array)');
        }
        const cleaned: string[] = (obj.childCredits as unknown[]).map(
          (c: unknown): string => String(c).trim()
        );
        childCredits = Array.from(new Set(cleaned.filter(Boolean)));
      }

      // optional extras if you decide to allow them (defensive parse)
      const limit =
        typeof obj.limit === "number" && Number.isFinite(obj.limit)
          ? (obj.limit as number)
          : undefined;
      const offset =
        typeof obj.offset === "number" && Number.isFinite(obj.offset)
          ? (obj.offset as number)
          : undefined;
      const releaseDateStart =
        typeof obj.releaseDateStart === "string"
          ? (obj.releaseDateStart as string)
          : undefined;
      const releaseDateEnd =
        typeof obj.releaseDateEnd === "string"
          ? (obj.releaseDateEnd as string)
          : undefined;

      const req: MusoSearchRequest = {
        keyword,
        type,
        childCredits,
        limit,
        offset,
        releaseDateStart,
        releaseDateEnd,
      };

      return req;
    } catch (err) {
      console.error("Failed to parse Muso request from Groq output:", err);
      throw new ReferenceParseError(GROQ_ERROR_MESSAGES.PARSE_ERROR, content);
    }
  }

  /**
   * Generates a playlist using the Groq API
   */
  public static async generatePlaylist(
    request: PlaylistGenerationRequest
  ): Promise<PlaylistGenerationResponse> {
    try {
      const { prompt, preferences = {} } = request;

      if (!prompt || prompt.trim().length === 0) {
        return {
          success: false,
          error: "Prompt cannot be empty",
          errorCode: "INVALID_INPUT",
        };
      }

      const messages: GroqChatMessage[] = [
        {
          role: "system",
          content: PLAYLIST_GENERATION_PROMPTS.SYSTEM,
        },
        {
          role: "user",
          content: this.formatPrompt(prompt, preferences),
        },
      ];

      const groqRequest: GroqChatRequest = {
        model: GROQ_CONFIG.MODELS.BALANCED,
        messages,
        max_tokens: GROQ_CONFIG.MAX_TOKENS,
        temperature: GROQ_CONFIG.TEMPERATURE,
        stream: false,
      };

      const response = await this.makeRequest(groqRequest);

      if (!response.choices || response.choices.length === 0) {
        return {
          success: false,
          error: GROQ_ERROR_MESSAGES.INVALID_RESPONSE,
          errorCode: "INVALID_RESPONSE",
        };
      }

      const aiContent = response.choices[0].message.content;
      const playlist = this.parsePlaylistResponse(aiContent);

      return {
        success: true,
        data: playlist,
      };
    } catch (error: unknown) {
      console.error("Playlist generation failed:", error);

      if (
        error instanceof GroqAPIError ||
        error instanceof PlaylistParseError
      ) {
        return {
          success: false,
          error: error.message,
          errorCode: error instanceof GroqAPIError ? error.code : "PARSE_ERROR",
        };
      }

      return {
        success: false,
        error: "An unexpected error occurred",
        errorCode: "UNKNOWN_ERROR",
      };
    }
  }

  /**
   * Generates a result for the 'find a...' mode
   */
  public static async findAResult(
    request: FindGenerationRequest
  ): Promise<FindGenerationResponse> {
    console.log("Finding a result...");

    try {
      const { prompt, preferences = {} } = request;

      if (!prompt || prompt.trim().length === 0) {
        return {
          success: false,
          error: "Prompt cannot be empty",
          errorCode: "INVALID_INPUT",
        };
      }

      const messages: GroqChatMessage[] = [
        {
          role: "system",
          content: FIND_GENERATION_PROMPTS.SYSTEM,
        },
        {
          role: "user",
          content: this.formatFindPrompt(prompt, preferences),
        },
      ];

      const groqRequest: GroqChatRequest = {
        model: GROQ_CONFIG.MODELS.BALANCED,
        messages,
        max_tokens: GROQ_CONFIG.MAX_TOKENS,
        temperature: GROQ_CONFIG.TEMPERATURE,
        stream: false,
      };

      const response = await this.makeRequest(groqRequest);
      console.log("Find Response: ", response);

      if (!response.choices || response.choices.length === 0) {
        return {
          success: false,
          error: GROQ_ERROR_MESSAGES.INVALID_RESPONSE,
          errorCode: "INVALID_RESPONSE",
        };
      }

      const aiContent = response.choices[0].message.content;
      const result = this.parseFindResponse(aiContent);

      return {
        success: true,
        data: result,
      };
    } catch (error: unknown) {
      console.error("Finding a result failed:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
        errorCode: "UNKNOWN_ERROR",
      };
    }
  }

  /**
   * Generates a result for the 'reference' mode
   */
  public static async generateReference(
    request: ReferenceGenerationRequest
  ): Promise<ReferenceGenerationResponse> {
    console.log("Generating a reference...");

    try {
      const { prompt, preferences = {} } = request;

      if (!prompt || prompt.trim().length === 0) {
        return {
          success: false,
          error: "Prompt cannot be empty",
          errorCode: "INVALID_INPUT",
        };
      }

      const messages: GroqChatMessage[] = [
        {
          role: "system",
          content: REFERENCE_GENERATION_PROMPTS.SYSTEM,
        },
        {
          role: "user",
          content: this.formatReferencePrompt(prompt, preferences),
        },
      ];

      const groqRequest: GroqChatRequest = {
        model: GROQ_CONFIG.MODELS.BALANCED,
        messages,
        max_tokens: GROQ_CONFIG.MAX_TOKENS,
        temperature: GROQ_CONFIG.TEMPERATURE,
        stream: false,
      };

      const response = await this.makeRequest(groqRequest);

      if (!response.choices || response.choices.length === 0) {
        return {
          success: false,
          error: GROQ_ERROR_MESSAGES.INVALID_RESPONSE,
          errorCode: "INVALID_RESPONSE",
        };
      }

      const aiContent = response.choices[0].message.content;
      const result = this.parseReferenceResponse(aiContent);

      return {
        success: true,
        data: result,
      };
    } catch (error: unknown) {
      console.error("Generating a reference failed:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
        errorCode: "UNKNOWN_ERROR",
      };
    }
  }

  /**
   * Full round-trip: use Groq to parse the user's intent into a Muso request,
   * then hit Muso /search and return the provider response.
   */
  public static async verifyWithMuso(
    userPrompt: string
  ): Promise<MusoGenerationResponse> {
    try {
      if (!userPrompt || userPrompt.trim().length === 0) {
        return {
          success: false,
          error: "Prompt cannot be empty",
          errorCode: "INVALID_INPUT",
        };
      }
      if (!MUSO_API_KEY) {
        return {
          success: false,
          error: "Muso API key missing",
          errorCode: "CONFIG_ERROR",
        };
      }

      // 1) Ask Groq to emit the Muso search JSON
      const messages: GroqChatMessage[] = [
        {
          role: "system",
          content:
            "You convert natural-language music queries into Muso /search JSON.",
        },
        { role: "user", content: this.formatMusoPrompt(userPrompt) },
      ];

      const groqRequest: GroqChatRequest = {
        model: GROQ_CONFIG.MODELS.BALANCED,
        messages,
        max_tokens: 300,
        temperature: 0, // deterministic parsing
        stream: false,
      };

      const groqResp = await this.makeRequest(groqRequest);
      if (!groqResp.choices?.length) {
        return {
          success: false,
          error: GROQ_ERROR_MESSAGES.INVALID_RESPONSE,
          errorCode: "INVALID_RESPONSE",
        };
      }

      // 2) Parse Groq JSON → Muso request
      const musoReq = this.parseMusoResponse(
        groqResp.choices[0].message.content
      );

      // 3) Call Muso
      const muso = new MusoService(MUSO_API_KEY);
      const musoResp: MusoSearchResponse = await muso.search(musoReq);

      // 4) Return in your standard wrapper
      const result: MusoGenerationResponse = {
        success: true,
        data: musoResp,
      };
      return result;
    } catch (error) {
      console.error("verifyWithMuso failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        errorCode: "MUSO_VERIFY_ERROR",
      };
    }
  }

  /**
   * Quick test method to verify API connectivity
   */
  public static async testConnection(): Promise<boolean> {
    try {
      const response = await this.generatePlaylist({
        prompt: "Create a test playlist with 3 popular songs",
        preferences: { maxTracks: 3 },
      });

      return response.success;
    } catch (error: unknown) {
      console.error("Groq connection test failed:", error);
      return false;
    }
  }
}