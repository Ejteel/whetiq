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

export async function sendProviderMessage(input: SendInput): Promise<SendOutput> {
  const transformedPrompt = buildTransformedPrompt(input);

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
