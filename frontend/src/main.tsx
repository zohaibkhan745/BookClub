import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import Maintenance from "./pages/Maintenance.tsx";
import "./app.css";

// Maintenance mode toggle - set VITE_MAINTENANCE=true in Vercel env to enable
const isMaintenance = import.meta.env.VITE_MAINTENANCE === "true";

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isMaintenance ? <Maintenance /> : <App />}</StrictMode>,
);
