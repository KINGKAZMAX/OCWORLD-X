import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { CreatePage } from "./pages/Create";
import { ChatPage } from "./pages/Chat";
import { TimelinePage } from "./pages/Timeline";

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? "#f8fafc" : "#94a3b8",
  textDecoration: "none",
  padding: "8px 12px",
  borderRadius: 10,
  background: isActive ? "rgba(148, 163, 184, 0.16)" : "transparent",
});

export function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
          color: "#e2e8f0",
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 28px",
            borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>OC World</div>
            <div style={{ color: "#94a3b8", marginTop: 4 }}>黑客松 Demo</div>
          </div>
          <nav style={{ display: "flex", gap: 8 }}>
            <NavLink to="/" style={linkStyle} end>
              Create
            </NavLink>
            <NavLink to="/chat" style={linkStyle}>
              Chat
            </NavLink>
            <NavLink to="/timeline" style={linkStyle}>
              Timeline
            </NavLink>
          </nav>
        </header>

        <main style={{ padding: 24 }}>
          <Routes>
            <Route path="/" element={<CreatePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
