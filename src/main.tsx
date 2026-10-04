import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { consoleGreeting, injectionDetector } from "./lib/easterEggs.ts";

// Harmless client-side Easter eggs: a dev console greeting + a URL attack-payload
// sniffer that warns (without ever reflecting the payload into the DOM).
consoleGreeting();
injectionDetector();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
