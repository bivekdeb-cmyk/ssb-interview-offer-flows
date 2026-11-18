"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { State, initialState, checkExpiry, currentRound, HOUR, MIN, DAY } from "./model";
import { buildScenario } from "./scenarios";

const KEY = "ssb-c4-flows-v3";

export type Device = "web" | "mweb";
export type TimeJump = "+1h" | "+1d" | "before20h" | "before5m" | "after" | "deadline";

/** Applies a simulated-time jump to a draft state. */
function applyJump(d: State, mode: TimeJump) {
  const r = currentRound(d);
  if (mode === "+1h") d.now += HOUR;
  else if (mode === "+1d") d.now += DAY;
  else if (mode === "before20h" && r) d.now = r.start - 20 * HOUR;
  else if (mode === "before5m" && r) d.now = r.start - 5 * MIN;
  else if (mode === "after" && r) d.now = r.start + 50 * MIN;
  else if (mode === "deadline" && d.offer.deadline) d.now = d.offer.deadline + MIN;
}

type Ctx = {
  s: State;
  update: (fn: (d: State) => void) => void;
  reset: () => void;
  load: (id: string) => void;
  jump: (mode: TimeJump) => void;
  scenario: string | null;
  panel: boolean;
  setPanel: (v: boolean) => void;
  /** Web or mobile-web preview (parent window only). */
  device: Device;
  setDevice: (d: Device) => void;
  /** True when this window is the app running inside the mobile phone frame. */
  inFrame: boolean;
  /** Scenario the phone frame should load next (parent → frame). */
  pending: { id: string; n: number } | null;
  consumePending: () => void;
};
const StoreCtx = createContext<Ctx | null>(null);

const frameWin = () => document.querySelector<HTMLIFrameElement>("iframe.mframe")?.contentWindow ?? null;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(() => initialState());
  const [scenario, setScenario] = useState<string | null>(null);
  const [panel, setPanel] = useState(false);
  const [device, setDeviceState] = useState<Device>("web");
  const [inFrame, setInFrame] = useState(false);
  const [pending, setPending] = useState<Ctx["pending"]>(null);
  const ready = useRef(false);
  // Parent in mobile mode mirrors the phone frame's state instead of owning it.
  const mirror = !inFrame && device === "mweb";
  const mirrorRef = useRef(mirror);
  mirrorRef.current = mirror;

  // Restore from localStorage (per-viewer convenience only)
  useEffect(() => {
    let framed = false;
    try {
      const q = new URLSearchParams(window.location.search);
      framed = q.get("frame") === "1";
      setInFrame(framed);
      const deep = q.get("screen");
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
      if (!framed) {
        setPanel(localStorage.getItem(KEY + ":panel") === "1");
        if (localStorage.getItem(KEY + ":device") === "mweb") setDeviceState("mweb");
      }
    } catch {}
    ready.current = true;
  }, []);

  // Persist (the phone frame owns persistence while mobile mode is on).
  useEffect(() => {
    if (!ready.current || mirrorRef.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ s, scenario }));
    } catch {}
  }, [s, scenario]);

  useEffect(() => {
    if (inFrame) return;
    try {
      localStorage.setItem(KEY + ":panel", panel ? "1" : "0");
    } catch {}
  }, [panel, inFrame]);

  // Frame → parent: publish state so the toolbar, panel and stats reflect the phone.
  useEffect(() => {
    if (!inFrame || !ready.current) return;
    try {
      window.parent.postMessage({ type: "ssb-state", s, scenario }, window.location.origin);
    } catch {}
  }, [s, scenario, inFrame]);

  // Messages: parent mirrors frame state; frame executes parent commands.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || !e.data || typeof e.data !== "object") return;
      const m = e.data as { type?: string; s?: State; scenario?: string | null; cmd?: string; mode?: TimeJump };
      if (m.type === "ssb-state" && !inFrame && mirrorRef.current && m.s) {
        setS(m.s);
        setScenario(m.scenario ?? null);
      }
      if (m.type === "ssb-cmd" && inFrame) {
        if (m.cmd === "reset") {
          setS(initialState());
          setScenario(null);
        } else if (m.cmd === "jump" && m.mode) {
          const mode = m.mode;
          setS((prev) => {
            const d = structuredClone(prev);
            applyJump(d, mode);
            checkExpiry(d);
            return d;
          });
        }
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [inFrame]);

  // Simulated clock: advances 1s per real second so timers tick (not in mirror mode).
  useEffect(() => {
    if (mirror) return;
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
  }, [mirror]);

  // Auto-hide toast
  useEffect(() => {
    if (!s.ui.toast || mirror) return;
    const t = setTimeout(() => setS((p) => ({ ...p, ui: { ...p.ui, toast: null } })), 3200);
    return () => clearTimeout(t);
  }, [s.ui.toast, mirror]);

  const update = useCallback((fn: (d: State) => void) => {
    setS((prev) => {
      const d = structuredClone(prev);
      fn(d);
      checkExpiry(d);
      return d;
    });
  }, []);

  const send = (msg: object) => frameWin()?.postMessage(msg, window.location.origin);

  const reset = useCallback(() => {
    if (mirrorRef.current) return send({ type: "ssb-cmd", cmd: "reset" });
    setS(initialState());
    setScenario(null);
  }, []);

  const jump = useCallback((mode: TimeJump) => {
    if (mirrorRef.current) return send({ type: "ssb-cmd", cmd: "jump", mode });
    update((d) => applyJump(d, mode));
  }, [update]);

  const load = useCallback((id: string) => {
    setS(buildScenario(id));
    setScenario(id);
    if (mirrorRef.current) setPending({ id, n: Date.now() });
  }, []);

  const setDevice = useCallback((d: Device) => {
    setDeviceState(d);
    try {
      localStorage.setItem(KEY + ":device", d);
      // Leaving mobile mode: pick up whatever the phone frame saved.
      if (d === "web") {
        const raw = localStorage.getItem(KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed?.s?.v === 3) {
          setS(parsed.s);
          setScenario(parsed.scenario ?? null);
        }
      } else {
        // Entering mobile mode: hand the current state to the frame via storage.
        localStorage.setItem(KEY, JSON.stringify({ s, scenario }));
      }
    } catch {}
  }, [s, scenario]);

  const consumePending = useCallback(() => setPending(null), []);

  return (
    <StoreCtx.Provider value={{ s, update, reset, load, jump, scenario, panel, setPanel, device, setDevice, inFrame, pending, consumePending }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
