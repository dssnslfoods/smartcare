import { useState, useEffect, useCallback } from "react";

export type TTSStatus = "idle" | "playing" | "paused";

export function useTTS() {
  const [status, setStatus] = useState<TTSStatus>("idle");
  const [supported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );

  // cancel fully on unmount
  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);

  const speak = useCallback((text: string) => {
    if (!supported) return;
    const ss = window.speechSynthesis;

    // If paused → resume from where we left off
    if (ss.paused && ss.speaking) {
      ss.resume();
      setStatus("playing");
      return;
    }

    // Fresh start
    ss.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = "th-TH";
    utt.rate  = 0.95;
    utt.pitch = 1;
    const voices = ss.getVoices();
    const thVoice =
      voices.find(v => v.lang.startsWith("th")) ??
      voices.find(v => v.lang.startsWith("en"));
    if (thVoice) utt.voice = thVoice;
    utt.onstart  = () => setStatus("playing");
    utt.onend    = () => setStatus("idle");
    utt.onerror  = () => setStatus("idle");
    utt.onpause  = () => setStatus("paused");
    utt.onresume = () => setStatus("playing");
    ss.speak(utt);
  }, [supported]);

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setStatus("paused");
  }, [supported]);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setStatus("idle");
  }, [supported]);

  return { status, supported, speak, pause, cancel };
}
