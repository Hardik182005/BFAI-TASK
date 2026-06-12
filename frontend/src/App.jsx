import React, { useState, Component } from "react";

class ErrorBoundary extends Component {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(e) { console.error("[BFAI ErrorBoundary]", e); }
  render() {
    if (this.state.crashed) return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-6">
        <span className="material-symbols-outlined text-5xl text-[#5317dd]">refresh</span>
        <p className="text-[18px] font-bold text-[#0d0d0d]">Something went wrong on this page.</p>
        <button onClick={() => { this.setState({ crashed: false }); window.location.hash = "#/chat"; }}
          className="px-6 py-2.5 bg-[#5317dd] text-white rounded-xl font-bold text-[14px] hover:bg-[#4311b8]">
          Back to Chat
        </button>
      </div>
    );
    return this.props.children;
  }
}

import { HashRouter as Router, Routes, Route, Outlet, Navigate, useNavigate } from "react-router-dom";
import SideNavBar from "./components/SideNavBar";
import TopNavBar from "./components/TopNavBar";
import VoiceOrb from "./components/VoiceOrb";
import Landing from "./pages/Landing";
import Chat from "./pages/Chat";
import Upload from "./pages/Upload";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";

function MobileDrawer({ open, onClose }) {
  const NAV = [
    { href: "#/chat",      icon: "chat",         label: "Ask BFAI"       },
    { href: "#/upload",    icon: "upload_file",  label: "Upload Docs"    },
    { href: "#/documents", icon: "folder_open",  label: "My Documents"   },
    { href: "#/settings",  icon: "settings",     label: "Settings"       },
  ];
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/30 md:hidden" onClick={onClose}>
      <div className="bg-white w-[240px] h-full flex flex-col border-r border-gray-100 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            </div>
            <span className="font-bold text-[14px] text-gray-900">BFAI</span>
          </div>
          <button onClick={onClose}><span className="material-symbols-outlined text-gray-400">close</span></button>
        </div>
        <ul className="flex flex-col gap-0.5 p-3 flex-grow">
          {NAV.map(({ href, icon, label }) => (
            <li key={href}>
              <a href={href} onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:text-primary hover:bg-purple-50 transition-all text-[13px] font-medium">
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#fcf9f8]">
      {/* Sidebar */}
      <SideNavBar />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main panel */}
      <div className="flex-1 md:ml-[240px] flex flex-col min-h-screen">
        <TopNavBar onToggleMobileMenu={() => setMobileOpen(v => !v)} />
        <main className="flex-1 bg-[#fcf9f8]">
          <Outlet />
        </main>
      </div>

      {/* Global floating BFAI voice + chat orb — visible on every route */}
      <VoiceOrb />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<ErrorBoundary><Landing /></ErrorBoundary>} />
          <Route element={<Layout />}>
            <Route path="/chat"      element={<ErrorBoundary><Chat /></ErrorBoundary>} />
            <Route path="/upload"    element={<ErrorBoundary><Upload /></ErrorBoundary>} />
            <Route path="/documents" element={<ErrorBoundary><Documents /></ErrorBoundary>} />
            <Route path="/settings"  element={<ErrorBoundary><Settings /></ErrorBoundary>} />
            <Route path="*"          element={<Navigate to="/chat" replace />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
