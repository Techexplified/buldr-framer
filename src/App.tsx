import { framer, CanvasNode, useIsAllowedTo } from "framer-plugin";
import { useState, useEffect, useRef } from "react";
import {
  Download,
  ClipboardPaste,
  Wand2,
  Copy,
  Search,
  Plus,
  Gem,
  MessageSquare,
  AlignJustify,
  ArrowUpRight,
  ArrowUp,
} from "lucide-react";
import "./App.css";

framer.showUI({
  position: "top right",
  width: 380,
  height: 540,
});

function useSelection() {
  const [selection, setSelection] = useState<CanvasNode[]>([]);
  useEffect(() => {
    return framer.subscribeToSelection(setSelection);
  }, []);
  return selection;
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

export function App() {
  const selection = useSelection();
  const isAllowed = useIsAllowedTo("addSVG");
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSuggestionClick = (item: string) => {
    const text = suggestionPrompts[item] ?? `Create a ${item} UI component.`;
    setPrompt(text);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(text.length, text.length);
    }, 0);
  };

  const recentItems = [
    {
      name: "Pricing Card",
      time: "Edited 1 hour ago",
      icon: <Gem size={14} />,
    },
    {
      name: "Testimonial Slider",
      time: "Edited 6 hours ago",
      icon: <MessageSquare size={14} />,
    },
    {
      name: "Navbar",
      time: "Edited yesterday",
      icon: <AlignJustify size={14} />,
    },
  ];

  const quickActions = [
    { icon: <Download size={14} />, label: "Import" },
    { icon: <ClipboardPaste size={14} />, label: "Paste UI" },
    { icon: <Wand2 size={14} />, label: "AI Improve" },
    { icon: <Copy size={14} />, label: "Duplicate" },
  ];

  return (
    <main className="container">
      {/* Suggestions */}
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

      <hr className="divider" />

      {/* Recent */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Recent</h2>
          <a href="#" className="view-all">
            View all{" "}
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
      </section>

      <hr className="divider" />

      {/* Quick Actions */}
      <section className="section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          {quickActions.map(({ icon, label }) => (
            <ActionButton key={label} icon={icon} label={label} />
          ))}
        </div>
      </section>

      {/* Component Input */}
      {/* Input container now handles the border and focus */}
      <div className="component-input-container">
        <textarea
          ref={textareaRef}
          placeholder="Describe a component…"
          className="comp-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="input-footer">
          <button className="icon-btn-secondary" aria-label="Add">
            <Plus size={18} />
          </button>
          <button className="icon-btn-primary" aria-label="Submit">
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </main>
  );
}

function ActionButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className="action-btn">
      <span className="action-icon">{icon}</span>
      <span className="action-label">{label}</span>
    </button>
  );
}
