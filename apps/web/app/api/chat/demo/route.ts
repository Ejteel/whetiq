import { NextRequest, NextResponse } from "next/server";
import { sendProviderMessage } from "../../../lib/chatRuntime";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const input = (await request.json()) as {
      provider: "openai" | "anthropic" | "gemini";
      model: string;
      text: string;
      enhance?: boolean;
    };

    const output = await sendProviderMessage({
      ...input,
      runtimeModeOverride: {
        mode: "demo",
        source: "forced_demo_endpoint"
      }
    });

    return NextResponse.json({
      text: output.text,
      final: {
        transformedPrompt: output.transformedPrompt
      },
      runtime: {
        mode: output.runtimeMode,
        source: output.runtimeSource
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
