import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/source-serif-4/opsz.css";
import "@fontsource-variable/source-serif-4/opsz-italic.css";
import "@fontsource-variable/libre-franklin";
import "@fontsource/courier-prime/400.css";
import "@fontsource/courier-prime/700.css";
import "./styles/tokens.css";
import "./styles/base.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
