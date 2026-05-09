import { framer, CanvasNode } from "framer-plugin";
import { useState, useEffect, useRef } from "react";
import {
  // Download,
  // ClipboardPaste,
  // Wand2,
  Copy,
  // Gem,
  // MessageSquare,
  // AlignJustify,
  ArrowUpRight,
  ArrowUp,
  Plus,
  Key,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Settings,
  ChevronRight,
  Code2,
  Trash2,
} from "lucide-react";
import "./App.css";

framer.showUI({
  position: "top right",
  width: 380,
  height: 580,
});

type Screen = "main" | "apikey" | "generating" | "result";

interface GeneratedComponent {
  name: string;
  code: string;
  prompt: string;
  timestamp: number;
}

function useSelection() {
  const [selection, setSelection] = useState<CanvasNode[]>([]);

  useEffect(() => {
    return framer.subscribeToSelection(setSelection);
  }, []);

  return selection;
}

function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>(() => {
    return localStorage.getItem("openrouter_api_key") || "";
  });

  const setApiKey = (key: string) => {
    localStorage.setItem("openrouter_api_key", key);
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    localStorage.removeItem("openrouter_api_key");
    setApiKeyState("");
  };

  return { apiKey, setApiKey, clearApiKey };
}

const suggestionPrompts: Record<string, string> = {
  "Word Flux":
    "Create an animated text component with smooth word-cycling transitions, bold typography, and a glowing accent color.",
  "Flow Tracker":
    "Create a kanban-style flow tracker with drag-and-drop columns, status badges, and a minimal dark card layout.",
  "Time Pulse":
    "Create a countdown timer component with a circular progress ring, large digit display, and pulsing animation when time is low.",
  "Depth Tilt":
    "Create a 3D tilt card component that responds to mouse movement with a parallax depth effect and subtle shadow.",
  "Echo Wave":
    "Create an animated audio waveform visualizer component with bar graph style bars that pulse rhythmically.",
};

const SUGGESTIONS = [
  "Word Flux",
  "Flow Tracker",
  "Time Pulse",
  "Depth Tilt",
  "Echo Wave",
];

const SYSTEM_PROMPT = `You are an expert Framer code component developer.

Generate production-ready Framer React TSX components.

STRICT RULES:

1. Output ONLY raw TSX code. No markdown. No backticks. No explanations.
2. ALWAYS include these imports at the top:
   import { addPropertyControls, ControlType } from "framer"
   import { useState, useEffect, useRef, useCallback, useMemo } from "react"
3. For animations you MAY import from "framer-motion":
   import { motion, useAnimation, useInView } from "framer-motion"
4. NEVER import from "framer/motion" — it does not exist. Only "framer-motion".
5. NEVER write: import React from "react"
6. NEVER write: React.useState, React.useEffect — always use named imports.
7. No external npm packages except "react", "framer", "framer-motion".
8. No external CSS files. Use only inline styles.
9. Always add @framer annotations above the export:
   /**
    * @framerIntrinsicWidth 500
    * @framerIntrinsicHeight 300
    * @framerSupportedLayoutWidth any-prefer-fixed
    * @framerSupportedLayoutHeight any-prefer-fixed
    */
10. Must export default function with a PascalCase name.
11. Always call addPropertyControls() at the bottom.
12. Component must fill its container: width "100%" height "100%".
13. Never return partial code. Always output the complete file.

EXAMPLE STRUCTURE:

import { addPropertyControls, ControlType } from "framer"
import { useState, useEffect } from "react"

/**
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 300
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MyComponent({ color = "#0099ff", label = "Hello" }) {
  const [active, setActive] = useState(false)

  return (
    <div style={{ width: "100%", height: "100%", background: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#fff", fontSize: 24 }}>{label}</span>
    </div>
  )
}

addPropertyControls(MyComponent, {
  color: { type: ControlType.Color, title: "Color", defaultValue: "#0099ff" },
  label: { type: ControlType.String, title: "Label", defaultValue: "Hello" },
})
`;

function extractComponentName(code: string) {
  const match = code.match(/export\\s+default\\s+function\\s+([A-Za-z0-9_]+)/);

  return match?.[1] || "GeneratedComponent";
}

async function generateComponent(
  prompt: string,
  apiKey: string,
  onProgress: (text: string) => void,
): Promise<string> {
  const componentName = prompt
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")
    .replace(/[^a-zA-Z0-9]/g, "");

  const userMessage = `Create a Framer component with this description: ${prompt}

The component function should be named "${componentName || "CustomComponent"}".`;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://framer.com",
        "X-Title": "Framer Workshop Plugin",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 3000,
      }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));

    const msg =
      (err as { error?: { message?: string } })?.error?.message ||
      `HTTP ${response.status}`;

    throw new Error(msg);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  if (!reader) throw new Error("No response body");

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;

      const data = line.slice(6).trim();

      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content || "";

        fullText += delta;
        onProgress(fullText);
      } catch {
        // ignore malformed chunks
      }
    }
  }

  return fullText.trim();
}

function sanitizeComponentCode(code: string) {
  let cleaned = code.trim();

  // Strip markdown fences
  cleaned = cleaned
    .replace(/```tsx/g, "")
    .replace(/```ts/g, "")
    .replace(/```jsx/g, "")
    .replace(/```js/g, "")
    .replace(/```/g, "")
    .trim();

  // Remove bare React default import (named imports are fine)
  cleaned = cleaned.replace(/^import React from ['"]react['"];?\n?/gm, "");

  // Fix wrong framer/motion import → framer-motion
  cleaned = cleaned.replace(
    /from ['"]framer\/motion['"]/g,
    'from "framer-motion"',
  );

  return cleaned;
}

function ApiKeyScreen({
  onBack,
  onSave,
  currentKey,
  onClear,
}: {
  onBack: () => void;
  onSave: (key: string) => void;
  currentKey: string;
  onClear: () => void;
}) {
  const [input, setInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentKey) {
      setInput("");
    }
  }, [currentKey]);

  const handleSave = () => {
    if (!input.trim()) return;

    onSave(input.trim());
    setInput("");
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
      onBack();
    }, 800);
  };

  const maskedKey = currentKey
    ? `${currentKey.slice(0, 8)}${"•".repeat(20)}${currentKey.slice(-4)}`
    : "";

  return (
    <div className="screen apikey-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack}>
          <X size={20} />
        </button>

        <span className="screen-title">API Key</span>

        <div style={{ width: 28 }} />
      </div>

      <div className="apikey-body">
        <div className="apikey-icon-wrap">
          <Key size={24} strokeWidth={1.5} />
        </div>

        <h3 className="apikey-heading">OpenRouter API Key</h3>

        <p className="apikey-sub">
          Your key is stored locally and never sent anywhere except OpenRouter.
        </p>

        {currentKey && (
          <div className="current-key-badge">
            <CheckCircle size={11} />
            <span>{maskedKey}</span>

            <button className="clear-key-btn" onClick={onClear}>
              <Trash2 size={10} />
            </button>
          </div>
        )}

        {!currentKey && (
          <div className="key-input-wrap">
            <input
              className="key-input"
              placeholder="sk-or-v1-..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
        )}

        {!currentKey && (
          <button
            className={`save-key-btn ${saved ? "saved" : ""}`}
            onClick={handleSave}
            disabled={!input.trim()}
          >
            {saved ? (
              <>
                <CheckCircle size={13} /> Saved
              </>
            ) : (
              "Save Key"
            )}
          </button>
        )}

        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noreferrer"
          className="get-key-link"
        >
          Get a free API key <ArrowUpRight size={10} />
        </a>
      </div>
    </div>
  );
}

function GeneratingScreen({
  prompt,
  streamText,
  error,
  onCancel,
}: {
  prompt: string;
  streamText: string;
  error: string | null;
  onCancel: () => void;
}) {
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [streamText]);

  return (
    <div className="screen generating-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onCancel}>
          <X size={14} />
        </button>

        <span className="screen-title">
          {error ? "Error" : "Generating..."}
        </span>

        <div style={{ width: 28 }} />
      </div>

      <div className="gen-prompt-pill">
        <Code2 size={11} />

        <span>{prompt.length > 60 ? prompt.slice(0, 60) + "…" : prompt}</span>
      </div>

      {error ? (
        <div className="gen-error">
          <AlertCircle size={18} />

          <p>{error}</p>

          <button className="back-btn-inline" onClick={onCancel}>
            Go back
          </button>
        </div>
      ) : (
        <>
          <div className="gen-status">
            <Loader2 size={13} className="spin" />
            <span>Building with GPT-4o mini</span>
          </div>

          <div className="code-stream" ref={codeRef}>
            <pre>{streamText || "Initializing…"}</pre>
          </div>
        </>
      )}
    </div>
  );
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function ResultScreen({
  component,
  onNew,
  onAddToCanvas,
  apiKey,
  onComponentUpdate,
}: {
  component: GeneratedComponent;
  onNew: () => void;
  onAddToCanvas: () => void;
  apiKey: string;
  onComponentUpdate: (updated: GeneratedComponent) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isRefining, setIsRefining] = useState(false);
  const [refineStream, setRefineStream] = useState("");
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, refineStream]);

  const handleCopy = () => {
    navigator.clipboard.writeText(component.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRefine = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || isRefining) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput("");
    setIsRefining(true);
    setRefineStream("");

    // Build the messages array for the API:
    // system + original generation turn + all follow-up turns
    const initialUserContent = `Create a Framer component with this description: ${component.prompt}`;
    const messages = [
      { role: "user", content: initialUserContent },
      { role: "assistant", content: component.code },
      ...newHistory.flatMap((m) =>
        m.role === "user"
          ? [{ role: "user", content: m.content }]
          : [{ role: "assistant", content: m.content }],
      ),
    ];

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://framer.com",
            "X-Title": "Framer Workshop Plugin",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
            stream: true,
            temperature: 0.7,
            max_tokens: 3000,
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg =
          (err as { error?: { message?: string } })?.error?.message ||
          `HTTP ${response.status}`;
        throw new Error(msg);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            fullText += delta;
            setRefineStream(fullText);
          } catch {
            // ignore malformed chunks
          }
        }
      }

      const cleanedCode = sanitizeComponentCode(fullText.trim());
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: cleanedCode,
      };
      setChatHistory((prev) => [...prev, assistantMsg]);
      setRefineStream("");

      const componentName = extractComponentName(cleanedCode);
      onComponentUpdate({
        ...component,
        name: componentName,
        code: cleanedCode,
        prompt: component.prompt,
        timestamp: Date.now(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Error: ${errorMsg}` },
      ]);
      setRefineStream("");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="screen result-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onNew}>
          <X size={14} />
        </button>

        <span className="screen-title">{component.name}</span>

        <div style={{ width: 28 }} />
      </div>

      <div className="result-success-badge">
        <CheckCircle size={13} />
        <span>Component generated</span>
      </div>

      <div className="result-prompt-box">
        <p className="result-prompt-text">{component.prompt}</p>
      </div>

      <div className="code-preview">
        <div className="code-preview-header">
          <span className="code-preview-lang">TSX</span>

          <span className="code-line-count">
            {component.code.split("\n").length} lines
          </span>
        </div>

        <div className="code-preview-body">
          <pre>{component.code}</pre>
        </div>
      </div>

      {/* ── Chat refinement section ── */}
      <div className="chat-section">
        {chatHistory.length > 0 && (
          <div className="chat-history">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
                {msg.role === "assistant" ? (
                  msg.content.startsWith("⚠️") ? (
                    <span className="chat-error-text">{msg.content}</span>
                  ) : (
                    <div className="chat-code-updated">
                      <CheckCircle size={10} />
                      <span>
                        Component updated · {msg.content.split("\n").length}{" "}
                        lines
                      </span>
                    </div>
                  )
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
            ))}

            {isRefining && refineStream && (
              <div className="chat-bubble chat-bubble--assistant">
                <div className="chat-streaming">
                  <Loader2 size={10} className="spin" />
                  <span>{refineStream.split("\n").length} lines…</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>
        )}

        <p className="instruction-text">
          Click on <strong>Create & Open File</strong> button.
        </p>

        <p className="instruction-text">
          Then drag it from <strong>Assets → Code</strong> onto your canvas.
        </p>

        <div className="result-actions">
          <button className="result-btn-secondary" onClick={handleCopy}>
            {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy Code"}
          </button>

          <button className="result-btn-primary" onClick={onAddToCanvas}>
            <Plus size={13} />
            Create & Open File
          </button>
        </div>

        <div>
          <button className="new-component-btn" onClick={onNew}>
            Generate another <ChevronRight size={12} />
          </button>
        </div>

        <div className="chat-input-wrap">
          <textarea
            ref={chatInputRef}
            className="chat-textarea"
            placeholder="Ask for changes… (e.g. make it red, add a hover effect)"
            value={chatInput}
            rows={2}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleRefine();
              }
            }}
            disabled={isRefining}
          />
          <button
            className={`chat-send-btn ${!chatInput.trim() || isRefining ? "chat-send-btn--disabled" : ""}`}
            onClick={handleRefine}
            disabled={!chatInput.trim() || isRefining}
            title="Send (⌘+Enter)"
          >
            {isRefining ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <ArrowUp size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function App() {
  useSelection();

  const { apiKey, setApiKey, clearApiKey } = useApiKey();

  const [screen, setScreen] = useState<Screen>("main");
  const [prompt, setPrompt] = useState("");
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [generatedComponent, setGeneratedComponent] =
    useState<GeneratedComponent | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<boolean>(false);

  const handleSuggestionClick = (item: string) => {
    const text = suggestionPrompts[item] ?? `Create a ${item} UI component.`;

    setPrompt(text);

    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(text.length, text.length);
    }, 0);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (!apiKey) {
      setScreen("apikey");
      return;
    }

    abortRef.current = false;

    setStreamText("");
    setError(null);
    setScreen("generating");

    try {
      const code = await generateComponent(prompt, apiKey, (text) => {
        if (!abortRef.current) {
          setStreamText(text);
        }
      });

      if (abortRef.current) return;

      const cleanedCode = sanitizeComponentCode(code);

      const componentName = extractComponentName(cleanedCode);

      const component: GeneratedComponent = {
        name: componentName,
        code: cleanedCode,
        prompt,
        timestamp: Date.now(),
      };

      setGeneratedComponent(component);
      setScreen("result");
    } catch (err) {
      if (!abortRef.current) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      }
    }
  };

  const handleCancel = () => {
    abortRef.current = true;

    setScreen("main");
    setStreamText("");
    setError(null);
  };

  const handleAddToCanvas = async () => {
    if (!generatedComponent) return;

    try {
      const safeName =
        generatedComponent.name
          .replace(/[^a-zA-Z0-9]/g, "")
          .replace(/^\d+/, "") || "GeneratedComponent";

      const fileName = `${safeName}.tsx`;
      const componentCode = sanitizeComponentCode(generatedComponent.code);

      const codeFile = await framer.createCodeFile(fileName, componentCode, {
        editViaPlugin: true,
      });

      // Wait for Framer to compile and register the code file
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Navigate to the code file view so user sees it compiled
      await codeFile.navigateTo();

      framer.notify(
        `✅ ${safeName} created! Find it in Assets → Code panel and drag to canvas.`,
        { variant: "success" },
      );
    } catch (err) {
      console.error(err);
      framer.notify(
        err instanceof Error ? err.message : "Failed to create component",
        { variant: "error" },
      );
    }
  };

  // const recentItems = [
  //   {
  //     name: "Pricing Card",
  //     time: "Edited 1 hour ago",
  //     icon: <Gem size={14} />,
  //   },
  //   {
  //     name: "Testimonial Slider",
  //     time: "Edited 6 hours ago",
  //     icon: <MessageSquare size={14} />,
  //   },
  //   {
  //     name: "Navbar",
  //     time: "Edited yesterday",
  //     icon: <AlignJustify size={14} />,
  //   },
  // ];

  // const quickActions = [
  //   { icon: <Download size={14} />, label: "Import" },
  //   { icon: <ClipboardPaste size={14} />, label: "Paste UI" },
  //   { icon: <Wand2 size={14} />, label: "AI Improve" },
  //   { icon: <Copy size={14} />, label: "Duplicate" },
  // ];

  if (screen === "apikey") {
    return (
      <ApiKeyScreen
        onBack={() => setScreen("main")}
        onSave={(key) => {
          setApiKey(key);
        }}
        currentKey={apiKey}
        onClear={() => {
          clearApiKey();
        }}
      />
    );
  }

  if (screen === "generating") {
    return (
      <GeneratingScreen
        prompt={prompt}
        streamText={streamText}
        error={error}
        onCancel={handleCancel}
      />
    );
  }

  if (screen === "result" && generatedComponent) {
    return (
      <ResultScreen
        component={generatedComponent}
        onNew={() => {
          setScreen("main");
          setPrompt("");
          setGeneratedComponent(null);
        }}
        onAddToCanvas={handleAddToCanvas}
        apiKey={apiKey}
        onComponentUpdate={(updated) => setGeneratedComponent(updated)}
      />
    );
  }

  return (
    <main className="container">
      <div className="topbar">
        <div className={`api-status ${apiKey ? "connected" : "disconnected"}`}>
          <span className="api-dot" />
          <span>{apiKey ? "API Connected" : "No API Key"}</span>
        </div>

        <button
          className="settings-btn"
          onClick={() => setScreen("apikey")}
          title="API Key Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      <section className="section">
        <h2 className="section-title">Suggestions</h2>

        <div className="grid-suggestions">
          {SUGGESTIONS.map((item) => (
            <button
              key={item}
              className="btn-suggestion"
              onClick={() => handleSuggestionClick(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* <hr className="divider" /> */}

      {/* Recent */}
      {/* <section className="section">
        <div className="section-header">
          <h2 className="section-title">Recent</h2>

          <a href="#" className="view-all">
            View all
            <ArrowUpRight
              size={9}
              style={{ display: "inline", verticalAlign: "middle" }}
            />
          </a>
        </div>

        <div className="recent-list">
          {recentItems.map((item) => (
            <div key={item.name} className="recent-item">
              <div className="item-icon">{item.icon}</div>

              <div className="item-details">
                <span className="item-name">{item.name}</span>
                <span className="item-time">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section> */}

      <hr className="divider" />

      {/* <section className="section">
        <h2 className="section-title">Quick Actions</h2>

        <div className="quick-actions">
          {quickActions.map(({ icon, label }) => (
            <ActionButton key={label} icon={icon} label={label} />
          ))}
        </div>
      </section> */}

      <div className="component-input-container">
        <textarea
          ref={textareaRef}
          placeholder="Describe a component…"
          className="comp-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleGenerate();
            }
          }}
        />

        <div className="input-footer">
          {/* <button className="icon-btn-secondary" aria-label="Add">
            <Plus size={18} />
          </button> */}

          <div></div>

          <div className="input-footer-right">
            {!apiKey && (
              <button
                className="no-key-hint"
                onClick={() => setScreen("apikey")}
              >
                <Key size={11} /> Add key
              </button>
            )}

            <button
              className={`icon-btn-primary ${!prompt.trim() ? "disabled" : ""}`}
              aria-label="Generate"
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              title="Generate (⌘+Enter)"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// function ActionButton({
//   icon,
//   label,
// }: {
//   icon: React.ReactNode;
//   label: string;
// }) {
//   return (
//     <button className="action-btn">
//       <span className="action-icon">{icon}</span>
//       <span className="action-label">{label}</span>
//     </button>
//   );
// }
