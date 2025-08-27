import { createContext, useContext } from "react";

export const TranscriptContext = createContext(null);

export const useTranscriptContext = () => {
  const context = useContext(TranscriptContext);
  if (!context) {
    throw new Error(
      "useTranscriptContext must be used within a TranscriptProvider"
    );
  }
  return context;
};
