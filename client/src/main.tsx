import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./style/global.css";
import "./index.css";

import App from "./App.tsx";
import { initTheme } from "./utils/theme";

initTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);