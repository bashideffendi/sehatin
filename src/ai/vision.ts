/**
 * Claude vision wrapper for food photo analysis.
 *
 * Pattern:
 *  1. Load image (path or base64), detect MIME type
 *  2. Pass image + TKPI food pool as RAG context
 *  3. Claude identifies items + estimates portions + computes kcal/macro
 *  4. Output: structured JSON grounded in TKPI codes
 *
 * Konteks: makanan Indonesia kompleks (nasi padang dengan multiple lauk,
 * gado-gado, soto dengan komponen terpisah). Claude vision lebih kuat
 * mengidentifikasi visual + reasoning porsi dari piring vs lookup database
 * generic.
 */
import dotenv from "dotenv";
import { readFileSync } from "node:fs";

dotenv.config({ override: true });
import { extname } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MODEL, getClient } from "./claude.ts";

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function detectMediaType(filename: string): ImageMediaType {
  const ext = extname(filename).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      throw new Error(`Unsupported image format: ${ext}. Pakai .jpg, .png, .webp, atau .gif`);
  }
}

export interface ImageInput {
  /** Path to local image file. */
  path?: string;
  /** Pre-encoded base64 image data (without `data:` prefix). */
  base64?: string;
  /** Media type, required if base64 provided. Inferred from path if path. */
  mediaType?: ImageMediaType;
}

export function loadImage(input: ImageInput): {
  base64: string;
  mediaType: ImageMediaType;
  sizeKB: number;
} {
  if (input.base64) {
    if (!input.mediaType) {
      throw new Error("mediaType required when passing base64");
    }
    return {
      base64: input.base64,
      mediaType: input.mediaType,
      sizeKB: Math.round((input.base64.length * 3) / 4 / 1024),
    };
  }
  if (!input.path) {
    throw new Error("Either path or base64 required");
  }
  const buffer = readFileSync(input.path);
  const base64 = buffer.toString("base64");
  return {
    base64,
    mediaType: input.mediaType ?? detectMediaType(input.path),
    sizeKB: Math.round(buffer.byteLength / 1024),
  };
}

export interface VisionAnalysisOptions {
  systemPrompt: string;
  /** Cached context block (e.g., TKPI food pool). */
  cachedContext?: string;
  cacheContext?: boolean;
  cacheSystem?: boolean;
  /** Optional user-supplied note ("ini sarapan saya"). */
  userNote?: string;
  /** Default instruction sent alongside the image. */
  userInstruction: string;
  image: ImageInput;
  maxTokens?: number;
  model?: string;
}

export interface VisionResponse<T = unknown> {
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

export async function callVisionJson<T = unknown>(
  opts: VisionAnalysisOptions,
): Promise<VisionResponse<T>> {
  const client = getClient();
  const model = opts.model ?? DEFAULT_MODEL;
  const img = loadImage(opts.image);

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

  // User message: image + instruction (+ optional note)
  const userContent: Anthropic.ContentBlockParam[] = [
    {
      type: "image",
      source: {
        type: "base64",
        media_type: img.mediaType,
        data: img.base64,
      },
    },
    {
      type: "text",
      text: opts.userNote
        ? `Catatan user: ${opts.userNote}\n\n${opts.userInstruction}`
        : opts.userInstruction,
    },
  ];

  const response = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 4096,
    system: systemBlocks,
    messages: [{ role: "user", content: userContent }],
  });

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

function extractJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    /* fall through */
  }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim()) as T;
    } catch {
      /* fall through */
    }
  }
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
    `Vision response gak valid JSON. First 200 chars: ${text.slice(0, 200)}`,
  );
}
