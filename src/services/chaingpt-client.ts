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
 * ⚠️ VERIFICATION STATUS: docs.chaingpt.org is blocked by this sandbox's
 * network egress proxy (confirmed via direct WebFetch - EGRESS_BLOCKED),
 * so the exact REST shape below was NOT independently verified against the
 * live docs. It reflects the most concrete evidence available via search:
 *   - Endpoint: POST https://api.chaingpt.org/chat/stream (a search result
 *     attributed this exact path + a curl example to the official docs;
 *     despite the "/stream" name, the docs excerpt states the endpoint
 *     returns the complete response once generation finishes if the
 *     caller does not opt into streaming, which is what this client does).
 *   - Auth: `Authorization: Bearer <CHAINGPT_API_KEY>` (the header format
 *     shown in that same curl example). A separate search result described
 *     an `api-key` header instead for the same endpoint family - the two
 *     did not agree, and this could not be resolved without a direct docs
 *     fetch. AUTH_HEADER_MODE below picks Bearer as the primary attempt;
 *     if requests start failing with 401s once a real key is in use, try
 *     flipping it to 'api-key' first before assuming the key itself is bad.
 *   - Request body: { model: 'general_assistant', question, chatHistory }
 *     (matches both the curl example and the official @chaingpt/generalchat
 *     SDK's createChatBlob() usage found via search).
 *   - Response body shape: NOT confirmed. The SDK example reads
 *     `res.data.bot` from createChatBlob()'s result; the raw REST response
 *     from /chat/stream was not shown anywhere reachable. parseResponseText()
 *     below tries several plausible shapes (JSON envelopes, SSE-style
 *     `data: {...}` chunks, plain text) and returns `ok: false` rather than
 *     guessing when none of them recognizably match - the no-fabrication
 *     rule applies to parsing this response just as much as to on-chain data.
 * Run a real request against a real CHAINGPT_API_KEY and adjust this file
 * once the actual shape is observed - that is expected, not a bug report.
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
