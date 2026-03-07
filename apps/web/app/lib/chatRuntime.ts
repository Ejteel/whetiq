export type Provider = "openai" | "anthropic" | "gemini";

export interface SendInput {
  provider: Provider;
  model: string;
  text: string;
  enhance?: boolean;
}

export interface SendOutput {
  text: string;
  transformedPrompt: string;
}

type RuntimeMode = "demo" | "private_live";

const MODE_CACHE_MS = 15000;
let cachedMode: RuntimeMode | null = null;
let cachedAt = 0;

function parseRuntimeMode(value: string | undefined): RuntimeMode | null {
  if (value === "demo" || value === "private_live") {
    return value;
  }
  return null;
}

async function resolveRuntimeMode(): Promise<RuntimeMode> {
  if (process.env.DEMO_MODE === "true") {
    return "demo";
  }

  const explicit = parseRuntimeMode(process.env.APP_RUNTIME_MODE);
  if (explicit) {
    return explicit;
  }

  const now = Date.now();
  if (cachedMode && now - cachedAt < MODE_CACHE_MS) {
    return cachedMode;
  }

  const settingsUrl = process.env.CONTROL_PLANE_SETTINGS_URL;
  const appId = process.env.CONTROL_PLANE_APP_ID;
  const serviceToken = process.env.CONTROL_PLANE_SERVICE_TOKEN;

  if (!settingsUrl || !appId || !serviceToken) {
    return "private_live";
  }

  try {
    const response = await fetch(`${settingsUrl}?appId=${encodeURIComponent(appId)}`, {
      headers: {
        Authorization: `Bearer ${serviceToken}`
      },
      cache: "no-store"
    });
    if (!response.ok) {
      return "private_live";
    }

    const payload = (await response.json()) as { mode?: string };
    const remote = parseRuntimeMode(payload.mode);
    if (remote) {
      cachedMode = remote;
      cachedAt = now;
      return remote;
    }
  } catch {
    return "private_live";
  }

  return "private_live";
}

function buildTransformedPrompt(input: SendInput): string {
  const enhancerPrefix = input.enhance
    ? "Apply house style: concise, structured, include assumptions."
    : "No enhancer rules.";

  return [
    "ROLE: Project assistant",
    `OBJECTIVE: Answer the user request for provider ${input.provider}`,
    `CONSTRAINTS: ${enhancerPrefix}`,
    "OUTPUT_FORMAT: Markdown with short sections",
    `USER_INPUT: ${input.text}`
  ].join("\n");
}

async function sendOpenAI(model: string, prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: "You are a precise assistant." },
        { role: "user", content: prompt }
      ]
    })
  });

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error((data as { error?: { message?: string } }).error?.message ?? "OpenAI request failed");
  }

  return data.choices?.[0]?.message?.content ?? "No response content";
}

async function sendAnthropic(model: string, prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: "You are a precise assistant.",
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }]
    })
  });

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Anthropic request failed");
  }

  return data.content?.find((item) => item.type === "text")?.text ?? "No response content";
}

async function sendGemini(model: string, prompt: string, apiKey: string): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    })
  });

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Gemini request failed");
  }

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "No response content";
}

function buildDemoResponse(input: SendInput, transformedPrompt: string): SendOutput {
  const words = input.text.trim().split(/\s+/).filter(Boolean).length;
  const preview = input.text.trim().slice(0, 180) || "No user input captured.";

  const text = [
    "## Demo Mode Response",
    "",
    "This project is running in demo mode. No provider API keys were used and no external LLM request was made.",
    "",
    "### Request Snapshot",
    `- Provider selected: **${input.provider}**`,
    `- Model selected: **${input.model}**`,
    `- Enhancer enabled: **${input.enhance ? "yes" : "no"}**`,
    `- Word count: **${words}**`,
    "",
    "### User Input Preview",
    `> ${preview}`,
    "",
    "### Why this exists",
    "- Safe for public demos",
    "- Prevents accidental key usage",
    "- Preserves full UI/UX behavior"
  ].join("\n");

  return {
    text,
    transformedPrompt
  };
}

export async function sendProviderMessage(input: SendInput): Promise<SendOutput> {
  const transformedPrompt = buildTransformedPrompt(input);
  const mode = await resolveRuntimeMode();

  if (mode === "demo") {
    return buildDemoResponse(input, transformedPrompt);
  }

  if (input.provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    return { text: await sendOpenAI(input.model, transformedPrompt, key), transformedPrompt };
  }

  if (input.provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    return { text: await sendAnthropic(input.model, transformedPrompt, key), transformedPrompt };
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  return { text: await sendGemini(input.model, transformedPrompt, key), transformedPrompt };
}
