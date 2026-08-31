/**
 * ChainGPT API client - the real integration for turning already-computed,
 * deterministic pipeline output (wallet facts, risk factors, alerts) into a
 * plain-language explanation.
 *
 * Design contract (documented and committed to publicly before this file
 * existed): ChainGPT explains, it never originates a fact. This client only
 * ever sends it text built entirely from real values already produced by
 * WalletIntelligenceAgent / RiskAgent / AlertEngine, and only ever asks it
 * to restate/summarize those values in plain language - never to "analyze
 * the wallet" from scratch or invent anything beyond the prompt. See
 * ExplanationAgent in src/agents/core_agents.ts for how the response is
 * used (and what happens - a deterministic, non-AI fallback, never silence
 * or a guess - when this client can't produce one).
 *
 * VERIFICATION STATUS (updated): docs.chaingpt.org remains unreachable from
 * this environment, but the four previously-unverified details below have
 * since been confirmed against an official curl example and a response
 * example recovered from the documentation:
 *   - Endpoint: POST https://api.chaingpt.org/chat/stream - CONFIRMED. The
 *     same endpoint serves buffered and streaming responses; a caller that
 *     does not opt into streaming receives the complete body, which is what
 *     this client does.
 *   - Auth: `Authorization: Bearer <CHAINGPT_API_KEY>` - CONFIRMED. This
 *     resolves the earlier conflict with a search result that described an
 *     `api-key` header; Bearer is correct, and AUTH_HEADER_MODE's primary
 *     choice below was right.
 *   - Request body: { model: 'general_assistant', question, chatHistory }
 *     with chatHistory as the string 'off' - CONFIRMED, matches what
 *     sendPrompt() sends.
 *   - Response body: { "status": true, "data": { "bot": "<text>" } } -
 *     CONFIRMED. parseResponseText() already reads `data.bot` as its first
 *     candidate, so no change was needed.
 *
 * STILL UNVERIFIED: no live request has been made against a real
 * CHAINGPT_API_KEY from anywhere that could observe the result. The shapes
 * above come from documentation examples, not from an observed exchange.
 * Confirm with:
 *   curl -X POST https://api.chaingpt.org/chat/stream \
 *     -H "Authorization: Bearer $CHAINGPT_API_KEY" \
 *     -H "Content-Type: application/json" \
 *     -d '{"model":"general_assistant","question":"Say OK","chatHistory":"off"}'
 * A 401 means the key, not the header format. Anything whose body is not
 * {status,data:{bot}} means parseResponseText() needs the observed shape
 * added - it returns ok:false rather than guessing, by design.
 */

const CHAINGPT_ENDPOINT = 'https://api.chaingpt.org/chat/stream';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_PROMPT_LENGTH = 4000; // guards against sending unbounded text if a caller passes something huge

export type ChainGptResult = { ok: true; text: string } | { ok: false; reason: string };

/**
 * Best-effort parse of ChainGPT's response body into plain explanation
 * text. Returns null (never a guessed string) when nothing recognizable
 * is found - see the VERIFICATION STATUS note above for why this has to
 * stay defensive instead of assuming one fixed shape.
 */
function parseResponseText(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  // Try a single JSON object first (the non-streaming / "blob" shape).
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const fromJson = extractTextField(parsed);
    if (fromJson) return fromJson;
  } catch {
    // Not a single JSON object - fall through to SSE-style handling below.
  }

  // Server-Sent-Events style: lines like "data: {...}" or "data: text", one
  // chunk per line: concatenate whatever text each chunk carries.
  if (trimmed.includes('data:')) {
    const pieces: string[] = [];
    for (const line of trimmed.split('\n')) {
      const withoutPrefix = line.replace(/^data:\s*/, '').trim();
      if (!withoutPrefix || withoutPrefix === '[DONE]') continue;
      try {
        const chunk = JSON.parse(withoutPrefix) as unknown;
        const chunkText = extractTextField(chunk);
        if (chunkText) pieces.push(chunkText);
      } catch {
        // Not JSON - treat the raw fragment itself as a text chunk.
        pieces.push(withoutPrefix);
      }
    }
    if (pieces.length > 0) return pieces.join('').trim();
  }

  // Last resort: if the raw body is plausible plain-text prose (no stray
  // braces suggesting a JSON envelope we failed to parse), use it as-is.
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return trimmed;
  }

  return null;
}

function extractTextField(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value === null || typeof value !== 'object') return null;

  const obj = value as Record<string, unknown>;
  // Known/plausible field names across the SDK example (`data.bot`) and
  // common chat-API conventions - checked in order, first string wins.
  const candidates: unknown[] = [
    (obj.data as Record<string, unknown> | undefined)?.bot,
    obj.bot,
    obj.answer,
    obj.response,
    obj.text,
    obj.message,
    (obj.choices as Array<{ text?: string; delta?: { content?: string } }> | undefined)?.[0]?.text,
    (obj.choices as Array<{ text?: string; delta?: { content?: string } }> | undefined)?.[0]?.delta?.content,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) return candidate;
  }
  return null;
}

export class ChainGptClient {
  constructor(private apiKey: string | undefined) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Sends `prompt` (expected to already be fully built from real,
   * deterministic pipeline data - see core_agents.ts's ExplanationAgent)
   * and returns ChainGPT's plain-language response, or ok: false with an
   * honest reason on any failure. Never throws for expected failure modes.
   */
  async generateExplanation(prompt: string): Promise<ChainGptResult> {
    if (!this.apiKey) {
      return { ok: false, reason: 'CHAINGPT_API_KEY is not configured.' };
    }

    const boundedPrompt = prompt.length > MAX_PROMPT_LENGTH ? prompt.slice(0, MAX_PROMPT_LENGTH) : prompt;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(CHAINGPT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'general_assistant',
          question: boundedPrompt,
          chatHistory: 'off',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return { ok: false, reason: `ChainGPT API returned HTTP ${response.status}.` };
      }

      const raw = await response.text();
      const text = parseResponseText(raw);

      if (!text) {
        return { ok: false, reason: 'ChainGPT API response did not match any recognized shape (see chaingpt-client.ts verification note).' };
      }

      return { ok: true, text };
    } catch (error) {
      const reason = error instanceof Error && error.name === 'AbortError' ? 'ChainGPT API request timed out.' : `ChainGPT API request failed: ${error instanceof Error ? error.message : String(error)}`;
      return { ok: false, reason };
    } finally {
      clearTimeout(timeout);
    }
  }
}
