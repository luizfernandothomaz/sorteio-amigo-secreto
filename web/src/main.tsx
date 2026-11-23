import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { Landing } from "./pages/Landing";
import { CreateGroup } from "./pages/CreateGroup";
import { Panel } from "./pages/Panel";
import { Reveal } from "./pages/Reveal";

const Narrow = ({ children }: { children: React.ReactNode }) => <main className="container">{children}</main>;

function Router() {
  const path = window.location.pathname;
  const group = path.match(/^\/g\/([\w-]+)/);
  const reveal = path.match(/^\/r\/([\w-]+)/);
  if (group) return <Narrow><Panel id={group[1]} adminKey={new URLSearchParams(location.search).get("key") ?? ""} /></Narrow>;
  if (reveal) return <Narrow><Reveal token={reveal[1]} /></Narrow>;
  if (path === "/novo") return <Narrow><CreateGroup /></Narrow>;
  return <Landing />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
);
