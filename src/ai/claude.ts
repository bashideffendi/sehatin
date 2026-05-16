/**
 * Anthropic SDK wrapper with prompt caching.
 *
 * Reads ANTHROPIC_API_KEY + ANTHROPIC_MODEL from env (via dotenv).
 * Exposes a thin client + a generic JSON-mode helper.
 */
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

// override: true supaya .env menang vs env yang udah pre-set empty oleh shell
// (kasus: shell parent set ANTHROPIC_API_KEY="" buat safety).
dotenv.config({ override: true });

export const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

let _client: Anthropic | null = null;
export function getClient(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.startsWith("sk-ant-..")) {
    throw new Error(
      "ANTHROPIC_API_KEY belum di-set. Copy .env.example → .env, isi API key, atau pakai --dry-run buat preview prompt aja.",
    );
  }
  _client = new Anthropic({ apiKey: key });
  return _client;
}

export interface JsonModeOptions {
  systemPrompt: string;
  /** System prompt akan di-cache (set true buat saving cost). */
  cacheSystem?: boolean;
  /** Optional cached context block (food DB, prices). Cached if set + cacheCachedContext=true */
  cachedContext?: string;
  cacheContext?: boolean;
  userPrompt: string;
  /** Max tokens dalam response. Default 4096. */
  maxTokens?: number;
  /** Override model. */
  model?: string;
}

export interface ClaudeResponse<T = unknown> {
  data: T;
  rawText: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number | null;
    cache_read_input_tokens?: number | null;
  };
  model: string;
  stop_reason: string | null;
}

/**
 * Call Claude expecting strict JSON output. Strips markdown fences if present.
 * Uses prompt caching when cacheSystem/cacheContext = true.
 */
export async function callJson<T = unknown>(
  opts: JsonModeOptions,
): Promise<ClaudeResponse<T>> {
  const client = getClient();
  const model = opts.model ?? DEFAULT_MODEL;

  const systemBlocks: Anthropic.TextBlockParam[] = [];

  systemBlocks.push({
    type: "text",
    text: opts.systemPrompt,
    ...(opts.cacheSystem ? { cache_control: { type: "ephemeral" } } : {}),
  });

  if (opts.cachedContext) {
    systemBlocks.push({
      type: "text",
      text: opts.cachedContext,
      ...(opts.cacheContext ? { cache_control: { type: "ephemeral" } } : {}),
    });
  }

  const response = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 4096,
    system: systemBlocks,
    messages: [{ role: "user", content: opts.userPrompt }],
  });

  // Concatenate any text blocks (Claude usually returns single text)
  const textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  const rawText = textBlocks.map((b) => b.text).join("");
  const data = extractJson<T>(rawText);

  return {
    data,
    rawText,
    usage: response.usage,
    model: response.model,
    stop_reason: response.stop_reason,
  };
}

/**
 * Pull JSON out of Claude response. Tolerant of markdown fences.
 */
function extractJson<T>(text: string): T {
  // Try strict parse first
  try {
    return JSON.parse(text) as T;
  } catch {
    /* fall through */
  }
  // Strip ```json ... ``` fence
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim()) as T;
    } catch {
      /* fall through */
    }
  }
  // Find first { ... last }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as T;
    } catch {
      /* fall through */
    }
  }
  throw new Error(
    `Claude response gak valid JSON. First 200 chars: ${text.slice(0, 200)}`,
  );
}
