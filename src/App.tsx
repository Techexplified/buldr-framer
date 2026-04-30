import { framer, CanvasNode, useIsAllowedTo } from "framer-plugin";
import { useState, useEffect } from "react";
import "./App.css";

// Adjusted dimensions to fit the full wireframe height
framer.showUI({
  position: "top right",
  width: 280,
  height: 540,
});

function useSelection() {
  const [selection, setSelection] = useState<CanvasNode[]>([]);
  useEffect(() => {
    return framer.subscribeToSelection(setSelection);
  }, []);
  return selection;
}

export function App() {
  const selection = useSelection();
  const isAllowed = useIsAllowedTo("addSVG");

  const handleAddSvg = async (name: string) => {
    await framer.addSVG({
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
      name: `${name}.svg`,
    });
  };

  return (
    <main className="container">
      {/* Header */}
      <header className="header">
        <div className="logo-row">
          <div className="logo-icon">✨</div>
          <h1 className="title">Buildr</h1>
        </div>
        <p className="subtitle">Design smarter, ship faster</p>
      </header>

      <hr className="divider" />

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
              onClick={() => handleAddSvg(item)}
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
          {[
            { name: "Pricing Card", time: "Edited 1 hour ago", icon: "💎" },
            {
              name: "Testimonial Slider",
              time: "Edited 6 hours ago",
              icon: "💬",
            },
            { name: "Navbar", time: "Edited yesterday", icon: "☰" },
          ].map((item) => (
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
          <ActionButton icon="📥" label="Import" />
          <ActionButton icon="📋" label="Paste UI" />
          <ActionButton icon="🪄" label="AI improve" />
          <ActionButton icon="👯" label="Duplicate" />
        </div>
      </section>

      {/* Make a Component Input */}
      <div className="component-input-container">
        <textarea placeholder="Make a Component..." className="comp-input" />
        <div className="input-footer">
          <button className="icon-btn">+</button>
          <button className="icon-btn">🔍</button>
        </div>
      </div>
    </main>
  );
}

function ActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="action-btn">
      <span className="action-icon">{icon}</span>
      <span className="action-label">{label}</span>
    </button>
  );
}
