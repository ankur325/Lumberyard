import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "rgb(var(--bg-panel))",
          border: "1px solid rgb(var(--border-strong))",
          color: "rgb(var(--fg))",
          fontFamily: "ui-monospace, monospace",
          fontSize: "13px",
        },
      }}
    />
  </React.StrictMode>,
);
