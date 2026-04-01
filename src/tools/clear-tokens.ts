import type { ToolResponse } from "../lib/types.js";
import { getTokenCount, clearTokens } from "../lib/token-store.js";

export async function handleClearTokens(
  _args: Record<string, unknown>
): Promise<ToolResponse> {
  const count = getTokenCount();
  clearTokens();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          { cleared: count, message: count > 0 ? `Cleared ${count} design tokens from the store.` : "Token store was already empty." },
          null,
          2
        ),
      },
    ],
  };
}
