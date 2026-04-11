export async function* iterateSSE(
  response: Response,
): AsyncIterable<{ event: string; data: string }> {
  if (!response.body) {
    return;
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";

  for (;;) {
    const { value } = await reader.read();

    if (value === undefined) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);

      if (rawEvent.length > 0) {
        const lines = rawEvent.split("\n");
        let event = "message";
        const dataLines: string[] = [];

        for (const line of lines) {
          if (line.startsWith("event:")) {
            event = line.slice(6).trim();
          }
          if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          }
        }

        yield { event, data: dataLines.join("\n") };
      }

      boundary = buffer.indexOf("\n\n");
    }
  }

  buffer += decoder.decode();
}

export function safeParseJson<T>(input: string): T | undefined {
  try {
    return JSON.parse(input) as T;
  } catch {
    return undefined;
  }
}
