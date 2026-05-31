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
          background: "#151a24",
          border: "1px solid #2f3848",
          color: "#e6e9ef",
          fontFamily: "ui-monospace, monospace",
          fontSize: "13px",
        },
      }}
    />
  </React.StrictMode>,
);
