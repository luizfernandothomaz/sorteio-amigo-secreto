import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { CreateGroup } from "./pages/CreateGroup";
import { Panel } from "./pages/Panel";
import { Reveal } from "./pages/Reveal";

function Router() {
  const path = window.location.pathname;
  const group = path.match(/^\/g\/([\w-]+)/);
  const reveal = path.match(/^\/r\/([\w-]+)/);
  if (group) return <Panel id={group[1]} adminKey={new URLSearchParams(location.search).get("key") ?? ""} />;
  if (reveal) return <Reveal token={reveal[1]} />;
  return <CreateGroup />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main className="container">
      <Router />
    </main>
  </StrictMode>,
);
