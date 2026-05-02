import { framer, CanvasNode, useIsAllowedTo } from "framer-plugin";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Download,
  ClipboardPaste,
  Wand2,
  Copy,
  Search,
  Plus,
  Gem,
  MessageSquare,
  AlignJustify,
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

export function App() {
  const selection = useSelection();
  const isAllowed = useIsAllowedTo("addSVG");
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAddSvg = async (name: string) => {
    await framer.addSVG({
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
      name: `${name}.svg`,
    });
  };

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
      icon: <Gem size={16} />,
    },
    {
      name: "Testimonial Slider",
      time: "Edited 6 hours ago",
      icon: <MessageSquare size={16} />,
    },
    {
      name: "Navbar",
      time: "Edited yesterday",
      icon: <AlignJustify size={16} />,
    },
  ];

  return (
    <main className="container">
      {/* Suggestions Grid */}
      <section className="section">
        <h2 className="section-title">Suggestions</h2>
        <div className="grid-suggestions">
          {[
            "Word Flux",
            "Flow Tracker",
            "Time Pulse",
            "Depth Tilt",
            "Echo Wave",
          ].map((item) => (
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

      {/* Recent Items */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Recent</h2>
          <a href="#" className="view-all">
            View all
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

      {/* Quick Actions */}
      <section className="section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          <ActionButton icon={<Download size={16} />} label="Import" />
          <ActionButton icon={<ClipboardPaste size={16} />} label="Paste UI" />
          <ActionButton icon={<Wand2 size={16} />} label="AI improve" />
          <ActionButton icon={<Copy size={16} />} label="Duplicate" />
        </div>
      </section>

      {/* Make a Component Input */}
      <div className="component-input-container">
        <textarea
          ref={textareaRef}
          placeholder="Make a Component..."
          className="comp-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="input-footer">
          <button className="icon-btn">
            <Plus size={16} />
          </button>
          <button className="icon-btn">
            <Search size={16} />
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
