"use client";

import { FormEvent, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Provider = "openai" | "anthropic" | "gemini";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  provider?: Provider;
  model?: string;
};

type SendResponse = {
  text?: string;
  final?: {
    transformedPrompt?: string;
  };
  error?: string;
};

declare global {
  interface Window {
    mvpDesktop?: {
      sendMessage: (input: Record<string, unknown>) => Promise<SendResponse>;
    };
  }
}

const MODELS: Record<Provider, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4.1"],
  anthropic: ["claude-3-7-sonnet-latest"],
  gemini: ["gemini-2.0-flash"]
};

const NAV_ITEMS = ["Search", "Customize", "Chats", "Projects", "Artifacts"];
const RECENTS = [
  "Federal news sourcing",
  "Provider adapter refinements",
  "Enhancer template design",
  "Cost dashboard notes"
];

export default function HomePage() {
  const [provider, setProvider] = useState<Provider>("openai");
  const [model, setModel] = useState<string>(MODELS.openai[0]);
  const [enhance, setEnhance] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transformedPrompt, setTransformedPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const recommendation = useMemo(() => {
    if (text.length > 2500) {
      return "Recommended: Claude (long context)";
    }
    if (text.toLowerCase().includes("debug") || text.toLowerCase().includes("code")) {
      return "Recommended: ChatGPT (debugging reliability)";
    }
    return "Recommended: ChatGPT (general tasks)";
  }, [text]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || busy) {
      return;
    }

    const userText = text.trim();
    const pendingProvider = provider;
    const pendingModel = model;

    setMessages((prev) => [...prev, { role: "user", text: userText, provider: pendingProvider, model: pendingModel }]);
    setText("");
    setBusy(true);

    const payload = {
      projectId: "local-project",
      threadId: "local-thread",
      provider: pendingProvider,
      model: pendingModel,
      text: userText,
      enhance
    };

    try {
      const response: SendResponse = window.mvpDesktop
        ? await window.mvpDesktop.sendMessage(payload)
        : await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }).then(async (r) => {
            const json = (await r.json()) as SendResponse;
            if (!r.ok) {
              throw new Error(json.error ?? "Send failed");
            }
            return json;
          });

      const assistantText = response.text ?? "No response returned.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: assistantText, provider: pendingProvider, model: pendingModel }
      ]);

      if (typeof response.final?.transformedPrompt === "string") {
        setTransformedPrompt(response.final.transformedPrompt);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${message}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="workspace">
      <aside className="leftRail">
        <button className="newChatButton">+ New chat</button>
        <nav className="mainNav">
          {NAV_ITEMS.map((item) => (
            <button key={item} className="navItem" type="button">
              {item}
            </button>
          ))}
        </nav>

        <div className="recentBlock">
          <h4>Recents</h4>
          <ul>
            {RECENTS.map((item, index) => (
              <li key={item} className={index === 0 ? "activeRecent" : ""}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="profileCard">
          <div className="avatar">E</div>
          <div>
            <div className="profileName">Ethan</div>
            <div className="profilePlan">Pro plan</div>
          </div>
        </div>
      </aside>

      <section className="chatColumn">
        <header className="threadHeader">
          <div className="crumb">POC Development</div>
          <div className="crumbDivider">/</div>
          <div className="crumb muted">Canonical conversation with provider switching</div>
        </header>

        <main className="threadBody">
          {messages.length === 0 ? (
            <div className="emptyState">Start a new message to test routing, enhancer transforms, and unified thread output.</div>
          ) : (
            messages.map((message, index) => (
              <article className={`bubble ${message.role}`} key={`${message.role}-${index}`}>
                <div className="bubbleMeta">
                  <strong>{message.role}</strong>
                  {message.provider ? <span>{`${message.provider} / ${message.model}`}</span> : null}
                </div>
                {message.role === "assistant" ? (
                  <div className="markdownBody">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="plainText">{message.text}</p>
                )}
              </article>
            ))
          )}
        </main>

        <form className="composer" onSubmit={onSubmit}>
          <div className="composerTopRow">
            <div className="pill">{recommendation}</div>
            <div className="controls">
              <label>
                Provider
                <select
                  value={provider}
                  onChange={(event) => {
                    const next = event.target.value as Provider;
                    setProvider(next);
                    setModel(MODELS[next][0]);
                  }}
                >
                  <option value="openai">ChatGPT</option>
                  <option value="anthropic">Claude</option>
                  <option value="gemini">Gemini</option>
                </select>
              </label>

              <label>
                Model
                <select value={model} onChange={(event) => setModel(event.target.value)}>
                  {MODELS[provider].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="toggleLabel">
                <input type="checkbox" checked={enhance} onChange={(event) => setEnhance(event.target.checked)} />
                Enhance
              </label>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Reply..."
            disabled={busy}
          />

          <div className="composerActions">
            <button type="button" className="secondary" onClick={() => setShowPrompt((value) => !value)}>
              View transformed prompt
            </button>
            <button type="submit" className="primary" disabled={busy}>
              {busy ? "Sending..." : "Send"}
            </button>
          </div>

          {showPrompt ? (
            <pre className="promptPreview">{transformedPrompt || "No transformed prompt snapshot yet."}</pre>
          ) : null}
        </form>
      </section>

    </div>
  );
}
