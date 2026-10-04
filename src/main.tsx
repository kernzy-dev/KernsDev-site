import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { consoleGreeting, injectionDetector, konamiCode } from "./lib/easterEggs.ts";

// Harmless client-side Easter eggs: a dev console greeting, a URL attack-payload
// sniffer (never reflects the payload into the DOM), and the classic Konami code.
consoleGreeting();
injectionDetector();
konamiCode();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
