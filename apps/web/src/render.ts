import type { ChatViewState } from "./uiModel.js";

function renderLeftRail(): string {
  return [
    "<aside class='left-rail'>",
    "<h2>Projects</h2>",
    "<input placeholder='Search chats + enhancers' />",
    "<button>Saved Enhancers</button>",
    "</aside>"
  ].join("");
}

function renderRightPanel(state: ChatViewState): string {
  return [
    "<aside class='right-panel'>",
    "<h3>Enhancer Pack</h3>",
    `<p>${state.enhancerPack?.name ?? "No enhancer selected"}</p>`,
    "<section><h4>Form Editor</h4><p>House rules, templates, provider overrides.</p></section>",
    "<section><h4>JSON Preview</h4><pre>{ ... }</pre></section>",
    "</aside>"
  ].join("");
}

export function renderChatView(state: ChatViewState): string {
  const messageItems = state.messages
    .map((message) => `<li><b>${message.role}</b>: ${message.contentBlocks.map((block) => block.type === "text" ? block.text : `[${block.type}]`).join(" ")}</li>`)
    .join("");

  return [
    "<main class='chat-layout'>",
    renderLeftRail(),
    "<section class='thread'>",
    `<header><h1>${state.thread.name}</h1></header>`,
    `<ul>${messageItems}</ul>`,
    `<footer>
      <label>Provider</label>
      <span>${state.composer.selectedProvider} / ${state.composer.selectedModel}</span>
      <label>Enhance</label>
      <span>${state.composer.enhanceEnabled ? "ON" : "OFF"}</span>
      <details ${state.composer.showTransformedPrompt ? "open" : ""}><summary>View transformed prompt</summary><pre>${state.transformedPromptPreview ?? "No prompt yet"}</pre></details>
    </footer>`,
    "</section>",
    renderRightPanel(state),
    "</main>"
  ].join("");
}
