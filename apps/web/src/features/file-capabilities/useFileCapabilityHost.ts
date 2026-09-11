import { useContext } from "react";
import { FileCapabilityContext } from "./FileCapabilityContext";

export function useFileCapabilityHost() {
  const context = useContext(FileCapabilityContext);
  if (!context) {
    throw new Error("File capabilities require FileCapabilityProvider");
  }
  return context;
}
