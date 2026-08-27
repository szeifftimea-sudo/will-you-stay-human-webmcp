import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { createBrowserServices } from "./app/bootstrap";
import "./ui/styles/app.css";

const root = document.getElementById("root");
if (!root) throw new Error("A React gyökérelem hiányzik.");

createRoot(root).render(
  <StrictMode>
    <App services={createBrowserServices()} />
  </StrictMode>,
);

