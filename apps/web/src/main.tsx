import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/client";

import "./styles/reset.css";
import "./styles/theme.css";
import "./styles/global.css";

import App from "./App";
import { ThemeProvider } from "@/lib/theme";
import { DialogProvider } from "@/providers";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <DialogProvider>
          <App />
        </DialogProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
