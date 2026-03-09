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

const NAV_ITEMS = ["Search", "Customize", "Chats", "Projects", "Artifacts"] as const;
type NavItem = (typeof NAV_ITEMS)[number];

const RECENTS = [
  "Federal news sourcing",
  "Provider adapter refinements",
  "Enhancer template design",
  "Cost dashboard notes"
];
const PROJECTS = ["POC Development", "Growth Experiments", "Prompt Library"];

export function WorkspaceClient({ chatEndpoint, mode }: WorkspaceClientProps) {
  const [provider, setProvider] = useState<Provider>("openai");
  const [model, setModel] = useState<string>(MODELS.openai[0]);
  const [enhance, setEnhance] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transformedPrompt, setTransformedPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeNav, setActiveNav] = useState<NavItem>("Chats");
  const [activeRecent, setActiveRecent] = useState(RECENTS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectName, setProjectName] = useState(PROJECTS[0]);

  const recommendation = useMemo(() => {
    if (text.length > 2500) {
      return "Recommended: Claude (long context)";
    }
    if (text.toLowerCase().includes("debug") || text.toLowerCase().includes("code")) {
      return "Recommended: ChatGPT (debugging reliability)";
    }
    return "Recommended: ChatGPT (general tasks)";
  }, [text]);

  const filteredRecents = useMemo(
    () => RECENTS.filter((item) => item.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant")?.text ?? "",
    [messages]
  );

  const headerContext =
    activeNav === "Chats"
      ? "Canonical conversation with provider switching"
      : activeNav === "Search"
        ? "Find and jump into recent working threads"
        : activeNav === "Customize"
          ? "Tune defaults for this workspace"
          : activeNav === "Projects"
            ? "Switch active project context"
            : "Review transformed prompt artifacts";

  const modeLabel = mode === "demo" ? "Demo Workspace (public)" : "Private Workspace (OAuth)";

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${message}` }]);
    } finally {
      setBusy(false);
    }
  }

  function handleSelectRecent(item: string) {
    setActiveRecent(item);
    setActiveNav("Chats");
    setProjectName("POC Development");
    if (!messages.length) {
      setText(`Continue work on: ${item}`);
    }
  }

  function renderThreadBody() {
    if (activeNav === "Search") {
      return (
        <section className="sectionPanel">
          <h3>Search Chats</h3>
          <p>Type to filter recents. Click a result to open it in Chats.</p>
          <input
            className="sectionInput"
            type="search"
            placeholder="Search recent threads..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <div className="sectionList">
            {filteredRecents.length ? (
              filteredRecents.map((item) => (
                <button key={item} type="button" className="sectionCard" onClick={() => handleSelectRecent(item)}>
                  {item}
                </button>
              ))
            ) : (
              <div className="sectionEmpty">No matching recents.</div>
            )}
          </div>
        </section>
      );
    }

    if (activeNav === "Customize") {
      return (
        <section className="sectionPanel">
          <h3>Workspace Defaults</h3>
          <p>These controls affect how new sends are configured.</p>
          <div className="sectionGrid">
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
            <label className="sectionToggle">
              <input type="checkbox" checked={enhance} onChange={(event) => setEnhance(event.target.checked)} />
              Enable prompt enhancement by default
            </label>
          </div>
        </section>
      );
    }

    if (activeNav === "Projects") {
      return (
        <section className="sectionPanel">
          <h3>Projects</h3>
          <p>Select an active project context for this thread.</p>
          <div className="sectionList">
            {PROJECTS.map((project) => (
              <button
                key={project}
                type="button"
                className={`sectionCard ${project === projectName ? "selected" : ""}`}
                onClick={() => {
                  setProjectName(project);
                  setActiveNav("Chats");
                }}
              >
                {project}
              </button>
            ))}
          </div>
        </section>
      );
    }

    if (activeNav === "Artifacts") {
      return (
        <section className="sectionPanel">
          <h3>Artifacts</h3>
          <p>Latest transformed prompt and assistant output snapshot.</p>
          <div className="artifactBox">
            <h4>Transformed Prompt</h4>
            <pre>{transformedPrompt || "No transformed prompt snapshot yet."}</pre>
          </div>
          <div className="artifactBox">
            <h4>Latest Assistant Response</h4>
            <pre>{latestAssistantMessage || "No assistant response yet."}</pre>
          </div>
        </section>
      );
    }

    if (messages.length === 0) {
      return <div className="emptyState">Start a new message to test routing, enhancer transforms, and unified thread output.</div>;
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
    <div className="workspace">
      <aside className="leftRail">
        <button
          className="newChatButton"
          type="button"
          onClick={() => {
            setMessages([]);
            setTransformedPrompt("");
            setText("");
            setActiveNav("Chats");
          }}
        >
          + New chat
        </button>
        <nav className="mainNav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              className={`navItem ${activeNav === item ? "active" : ""}`}
              type="button"
              onClick={() => setActiveNav(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="recentBlock">
          <h4>Recents</h4>
          <ul>
            {RECENTS.map((item, index) => (
              <li key={item}>
                <button
                  type="button"
                  className={`recentItem ${activeRecent === item || (index === 0 && activeRecent === RECENTS[0]) ? "activeRecent" : ""}`}
                  onClick={() => handleSelectRecent(item)}
                >
                  {item}
                </button>
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
          <div className="crumb">{projectName}</div>
          <div className="crumbDivider">/</div>
          <div className="crumb muted">{headerContext}</div>
          <div className="crumbDivider">/</div>
          <div className="crumb muted">{modeLabel}</div>
        </header>

        <main className="threadBody">{renderThreadBody()}</main>

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
