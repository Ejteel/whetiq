"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Provider = "openai" | "anthropic" | "gemini";
type RuntimeMode = "demo" | "private_live";
type RuntimeSource = "forced_demo_endpoint" | "demo_env" | "app_runtime_mode" | "control_plane" | "fallback_default";

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
  runtime?: {
    mode: RuntimeMode;
    source: RuntimeSource;
  };
  error?: string;
};

type WorkspaceClientProps = {
  chatEndpoint: "/api/chat" | "/api/chat/demo";
  mode: "demo" | "private";
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

const BOTTOM_THRESHOLD_PX = 56;

function isNearBottom(container: HTMLElement): boolean {
  return container.scrollHeight - (container.scrollTop + container.clientHeight) <= BOTTOM_THRESHOLD_PX;
}

function formatRuntimeSource(source: RuntimeSource): string {
  if (source === "control_plane") {
    return "Control Plane";
  }
  if (source === "app_runtime_mode") {
    return "APP_RUNTIME_MODE";
  }
  if (source === "demo_env") {
    return "DEMO_MODE";
  }
  if (source === "forced_demo_endpoint") {
    return "Demo endpoint";
  }
  return "Fallback default";
}

export function WorkspaceClient({ chatEndpoint, mode }: WorkspaceClientProps) {
  const [provider, setProvider] = useState<Provider>("openai");
  const [model, setModel] = useState<string>(MODELS.openai[0]);
  const [enhance, setEnhance] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transformedPrompt, setTransformedPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [runtimeInfo, setRuntimeInfo] = useState<{ mode: RuntimeMode; source: RuntimeSource } | null>(null);

  const threadBodyRef = useRef<HTMLElement | null>(null);
  const userInteractedRef = useRef(false);

  const recommendation = useMemo(() => {
    if (text.length > 2500) {
      return "Recommended: Claude (long context)";
    }
    if (text.toLowerCase().includes("debug") || text.toLowerCase().includes("code")) {
      return "Recommended: ChatGPT (debugging reliability)";
    }
    return "Recommended: ChatGPT (general tasks)";
  }, [text]);

  const modeLabel = mode === "demo" ? "Demo Workspace (public)" : "Private Workspace";

  function scrollToLatest(behavior: ScrollBehavior = "smooth") {
    const node = threadBodyRef.current;
    if (!node) {
      return;
    }
    node.scrollTo({ top: node.scrollHeight, behavior });
  }

  function onThreadScroll() {
    const node = threadBodyRef.current;
    if (!node) {
      return;
    }
    const nearBottom = isNearBottom(node);
    setStickToBottom(nearBottom);
    if (nearBottom) {
      setShowJumpToLatest(false);
    }
    userInteractedRef.current = true;
  }

  useEffect(() => {
    const node = threadBodyRef.current;
    if (!node) {
      return;
    }

    if (stickToBottom) {
      scrollToLatest(messages.length > 2 ? "smooth" : "auto");
      return;
    }

    if (userInteractedRef.current && messages.length > 0) {
      setShowJumpToLatest(true);
    }
  }, [messages, stickToBottom]);

  useEffect(() => {
    if (!showPrompt && stickToBottom) {
      scrollToLatest("auto");
    }
  }, [showPrompt, stickToBottom]);

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
        : await fetch(chatEndpoint, {
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

      if (response.runtime) {
        setRuntimeInfo(response.runtime);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${message}` }]);
    } finally {
      setBusy(false);
    }
  }

  function renderThreadBody() {
    if (messages.length === 0) {
      return (
        <div className="emptyState">
          Start with a real task and send your first prompt. This workspace only shows live conversation state and
          response output.
        </div>
      );
    }

    return messages.map((message, index) => (
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
    ));
  }

  return (
    <div className="workspace workspaceSingle">
      <section className="chatColumn">
        <header className="threadHeader">
          <div className="crumb">{modeLabel}</div>
          {mode === "private" && runtimeInfo ? (
            <>
              <div className="crumbDivider">/</div>
              <div className="crumb muted">{runtimeInfo.mode === "demo" ? "Demo runtime" : "Private live runtime"}</div>
              <div className="crumbDivider">/</div>
              <div className="crumb muted">{formatRuntimeSource(runtimeInfo.source)}</div>
            </>
          ) : null}
        </header>

        <main ref={threadBodyRef} data-testid="thread-body" className="threadBody" onScroll={onThreadScroll}>
          {renderThreadBody()}
        </main>

        {showJumpToLatest ? (
          <div className="jumpWrap">
            <button
              type="button"
              className="jumpButton"
              onClick={() => {
                setStickToBottom(true);
                setShowJumpToLatest(false);
                scrollToLatest("smooth");
              }}
            >
              Jump to latest
            </button>
          </div>
        ) : null}

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
            placeholder="Ask your question..."
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
