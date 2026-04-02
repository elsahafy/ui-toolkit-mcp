import { inflateSync } from "node:zlib";
import type { ToolResponse, VisualDiffResult } from "../lib/types.js";
import { validateBase64, validateMaxLength } from "../lib/validation.js";
import { clamp } from "../lib/utils.js";

const MAX_IMAGE_SIZE = 50_000_000; // 50MB base64

export async function handleVisualDiff(
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const beforeB64 = args.before_image as string | undefined;
  const afterB64 = args.after_image as string | undefined;

  if (!beforeB64 || !afterB64) {
    return error("Missing required parameters: before_image, after_image");
  }

  const beforeLenErr = validateMaxLength(beforeB64, MAX_IMAGE_SIZE, "before_image");
  if (beforeLenErr) return error(beforeLenErr);

  const afterLenErr = validateMaxLength(afterB64, MAX_IMAGE_SIZE, "after_image");
  if (afterLenErr) return error(afterLenErr);

  const beforeErr = validateBase64(beforeB64, "before_image");
  if (beforeErr) return error(beforeErr);

  const afterErr = validateBase64(afterB64, "after_image");
  if (afterErr) return error(afterErr);

  const threshold = clamp(args.threshold as number | undefined, 0, 255, 10);

  const beforeBuf = Buffer.from(beforeB64, "base64");
  const afterBuf = Buffer.from(afterB64, "base64");

  const beforeInfo = parsePngHeader(beforeBuf);
  if (typeof beforeInfo === "string") return error(`before_image: ${beforeInfo}`);

  const afterInfo = parsePngHeader(afterBuf);
  if (typeof afterInfo === "string") return error(`after_image: ${afterInfo}`);

  if (beforeInfo.width !== afterInfo.width || beforeInfo.height !== afterInfo.height) {
    return error(
      `Image dimensions differ: before=${beforeInfo.width}x${beforeInfo.height}, after=${afterInfo.width}x${afterInfo.height}`
    );
  }

  // Fast path: identical bytes
  if (beforeBuf.equals(afterBuf)) {
    return formatResult({
      width: beforeInfo.width, height: beforeInfo.height,
      totalPixels: beforeInfo.width * beforeInfo.height,
      changedPixels: 0, diffPercentage: 0, match: true,
    });
  }

  // Decode pixel data
  let beforePixels: Buffer;
  let afterPixels: Buffer;
  try {
    beforePixels = decodePngPixels(beforeBuf, beforeInfo);
    afterPixels = decodePngPixels(afterBuf, afterInfo);
  } catch (err) {
    return error(`PNG decode error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Compare pixels
  const { width, height } = beforeInfo;
  const totalPixels = width * height;
  let changedPixels = 0;

  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4;
    const dr = Math.abs(beforePixels[offset] - afterPixels[offset]);
    const dg = Math.abs(beforePixels[offset + 1] - afterPixels[offset + 1]);
    const db = Math.abs(beforePixels[offset + 2] - afterPixels[offset + 2]);
    const da = Math.abs(beforePixels[offset + 3] - afterPixels[offset + 3]);
    if (dr > threshold || dg > threshold || db > threshold || da > threshold) {
      changedPixels++;
    }
  }

  const diffPercentage = Math.round((changedPixels / totalPixels) * 10000) / 100;

  return formatResult({ width, height, totalPixels, changedPixels, diffPercentage, match: changedPixels === 0 });
}

// ========================================
// PNG PARSING (8-bit RGBA only)
// ========================================

interface PngInfo {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function parsePngHeader(buf: Buffer): PngInfo | string {
  if (buf.length < 33) return "Not a valid PNG (too small)";
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) return "Not a valid PNG (bad signature)";

  const ihdrLen = buf.readUInt32BE(8);
  const ihdrType = buf.subarray(12, 16).toString("ascii");
  if (ihdrType !== "IHDR" || ihdrLen < 13) return "Missing IHDR chunk";

  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];
  const interlace = buf[28];

  if (interlace !== 0) return "Interlaced PNGs are not supported. Re-export without interlacing.";
  if (bitDepth !== 8) return `Only 8-bit PNGs are supported. Got ${bitDepth}-bit.`;
  if (colorType !== 6 && colorType !== 2) return `Only RGB/RGBA PNGs are supported. Got color type ${colorType}.`;

  return { width, height, bitDepth, colorType };
}

function extractIdatData(buf: Buffer): Buffer {
  const chunks: Buffer[] = [];
  let offset = 8;
  while (offset + 12 <= buf.length) {
    const len = buf.readUInt32BE(offset);
    if (offset + 12 + len > buf.length) break; // Bounds check: prevent overflow
    const type = buf.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IDAT") {
      chunks.push(buf.subarray(offset + 8, offset + 8 + len));
    }
    offset += 12 + len;
  }
  return Buffer.concat(chunks);
}

function decodePngPixels(buf: Buffer, info: PngInfo): Buffer {
  const idatData = extractIdatData(buf);
  const raw = inflateSync(idatData);

  const channels = info.colorType === 6 ? 4 : 3;
  const stride = info.width * channels + 1;
  const expectedLen = info.height * stride;

  if (raw.length < expectedLen) {
    throw new Error(`Decompressed data too short: expected ${expectedLen} bytes, got ${raw.length}`);
  }

  const pixels = Buffer.alloc(info.width * info.height * 4);
  const prevRow = Buffer.alloc(info.width * channels);

  for (let y = 0; y < info.height; y++) {
    const rowStart = y * stride;
    const filter = raw[rowStart];
    const row = Buffer.alloc(info.width * channels);

    for (let x = 0; x < info.width * channels; x++) {
      const curr = raw[rowStart + 1 + x];
      const a = x >= channels ? row[x - channels] : 0;
      const b = prevRow[x];
      const c = x >= channels ? prevRow[x - channels] : 0;

      switch (filter) {
        case 0: row[x] = curr; break;
        case 1: row[x] = (curr + a) & 0xff; break;
        case 2: row[x] = (curr + b) & 0xff; break;
        case 3: row[x] = (curr + ((a + b) >> 1)) & 0xff; break;
        case 4: row[x] = (curr + paeth(a, b, c)) & 0xff; break;
        default: row[x] = curr;
      }
    }

    for (let x = 0; x < info.width; x++) {
      const pi = (y * info.width + x) * 4;
      const ri = x * channels;
      pixels[pi] = row[ri];
      pixels[pi + 1] = row[ri + 1];
      pixels[pi + 2] = row[ri + 2];
      pixels[pi + 3] = channels === 4 ? row[ri + 3] : 255;
    }

    row.copy(prevRow);
  }

  return pixels;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function formatResult(result: VisualDiffResult): ToolResponse {
  const parts: string[] = [];
  parts.push(`## Visual Diff Result\n`);
  parts.push(`| Metric | Value |`);
  parts.push(`|--------|-------|`);
  parts.push(`| Dimensions | ${result.width}x${result.height} |`);
  parts.push(`| Total pixels | ${result.totalPixels.toLocaleString()} |`);
  parts.push(`| Changed pixels | ${result.changedPixels.toLocaleString()} |`);
  parts.push(`| Diff percentage | ${result.diffPercentage}% |`);
  parts.push(`| Match | ${result.match ? "Yes (identical)" : "No (differences found)"} |`);

  if (!result.match) {
    parts.push(`\n### Summary`);
    if (result.diffPercentage < 1) {
      parts.push("Minor visual differences detected (< 1%). Likely anti-aliasing or sub-pixel rendering.");
    } else if (result.diffPercentage < 5) {
      parts.push("Moderate visual changes detected. Review the affected areas.");
    } else {
      parts.push("Significant visual changes detected. This likely represents an intentional layout or style change.");
    }
  }

  return { content: [{ type: "text", text: parts.join("\n") }] };
}


function error(message: string): ToolResponse {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}
