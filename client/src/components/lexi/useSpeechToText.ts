import { useCallback, useMemo, useRef, useState } from "react";

type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onerror: (e: { error?: string }) => void;
  onend: () => void;
  onresult: (event: {
    resultIndex: number;
    results: { [key: number]: { [key: number]: { transcript?: string } } };
    length: number;
  }) => void;
  start: () => void;
  stop: () => void;
};

export function useSpeechToText() {
  const [isSupported] = useState(() => {
    return typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  });
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  const SpeechRecognitionCtor = useMemo(() => {
    const w = window as Window & { SpeechRecognition?: new () => SpeechRecognitionType; webkitSpeechRecognition?: new () => SpeechRecognitionType };
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognitionCtor) return;
    setError(null);

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = (e) => {
      setError(e?.error || "speech_error");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < Object.keys(event.results).length; i++) {
        const res = event.results[i];
        text += res[0]?.transcript ?? "";
      }
      setTranscript((prev) => (prev ? `${prev} ${text}`.trim() : text.trim()));
    };

    recognition.start();
  }, [SpeechRecognitionCtor]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop?.();
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return { isSupported, isListening, transcript, error, start, stop, reset };
}
