"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { State, initialState, checkExpiry } from "./model";
import { buildScenario } from "./scenarios";

const KEY = "ssb-c4-flows-v3";

type Ctx = {
  s: State;
  update: (fn: (d: State) => void) => void;
  reset: () => void;
  load: (id: string) => void;
  scenario: string | null;
  panel: boolean;
  setPanel: (v: boolean) => void;
};
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(() => initialState());
  const [scenario, setScenario] = useState<string | null>(null);
  const [panel, setPanel] = useState(false);
  const ready = useRef(false);

  // Restore from localStorage (per-viewer convenience only)
  useEffect(() => {
    try {
      const deep = new URLSearchParams(window.location.search).get("screen");
      const raw = deep ? null : localStorage.getItem(KEY);
      if (deep) {
        setS(buildScenario(deep));
        setScenario(deep);
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.s?.v === 3) {
          setS(parsed.s);
          setScenario(parsed.scenario ?? null);
        }
      }
      setPanel(localStorage.getItem(KEY + ":panel") === "1");
    } catch {}
    ready.current = true;
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ s, scenario }));
    } catch {}
  }, [s, scenario]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY + ":panel", panel ? "1" : "0");
    } catch {}
  }, [panel]);

  // Simulated clock: advances 1s per real second so timers tick.
  useEffect(() => {
    const t = setInterval(() => {
      setS((prev) => {
        const d: State = { ...prev, now: prev.now + 1000 };
        if (d.offer.status === "live" && d.offer.deadline && d.now > d.offer.deadline) {
          const c = structuredClone(d);
          checkExpiry(c);
          return c;
        }
        return d;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (!s.ui.toast) return;
    const t = setTimeout(() => setS((p) => ({ ...p, ui: { ...p.ui, toast: null } })), 3200);
    return () => clearTimeout(t);
  }, [s.ui.toast]);

  const update = useCallback((fn: (d: State) => void) => {
    setS((prev) => {
      const d = structuredClone(prev);
      fn(d);
      checkExpiry(d);
      return d;
    });
  }, []);

  const reset = useCallback(() => {
    setS(initialState());
    setScenario(null);
  }, []);

  const load = useCallback((id: string) => {
    setS(buildScenario(id));
    setScenario(id);
  }, []);

  return <StoreCtx.Provider value={{ s, update, reset, load, scenario, panel, setPanel }}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
