"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { SCENARIOS } from "@/lib/scenarios";
import { Overlays, Panel, TopNav } from "./chrome";

/** Full-window app frame: the page never scrolls, only inner panes do. */
function Stage({ children }: { children: React.ReactNode }) {
  return <div className="stage">{children}</div>;
}

/** Keeps the navbar's right edge aligned with the content column (offset by the content scrollbar width). */
function useScrollbarSync() {
  useEffect(() => {
    const sync = () => {
      const c = document.querySelector<HTMLElement>(".content");
      document.documentElement.style.setProperty("--sbw", `${c ? c.offsetWidth - c.clientWidth : 0}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    const c = document.querySelector(".content");
    if (c) ro.observe(c);
    window.addEventListener("resize", sync);
    return () => { ro.disconnect(); window.removeEventListener("resize", sync); };
  });
}

/** 390×844 phone frame that runs the same app at a real mobile viewport. */
function Phone() {
  const path = usePathname();
  const router = useRouter();
  const { pending, consumePending } = useStore();
  const [src, setSrc] = useState<string | null>(null);

  // Walkthrough / edge-case clicks in the toolbar load that screen inside the phone.
  useEffect(() => {
    const sc = pending ? SCENARIOS.find((x) => x.id === pending.id) : null;
    if (pending && sc) {
      if (sc.route === path) {
        setSrc(`${path}?frame=1&screen=${sc.id}&k=${pending.n}`);
        consumePending();
      }
      return;
    }
    // Plain navigation (top-bar views): keep the phone's state, just change its page.
    const fw = document.querySelector<HTMLIFrameElement>("iframe.mframe")?.contentWindow;
    let framePath: string | null = null;
    try { framePath = fw?.location.pathname ?? null; } catch {}
    setSrc((cur) => (cur && framePath === path ? cur : `${path}?frame=1`));
  }, [path, pending, consumePending]);

  // Follow navigation that happens inside the phone (e.g. tapping a flow-map box).
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "ssb-path") return;
      if (e.data.path && e.data.path !== window.location.pathname) router.replace(e.data.path);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [router]);

  return (
    <div className="phone-wrap">
      <div className="phone">
        {src && <iframe className="mframe" src={src} title="Mobile web preview" />}
      </div>
      <div className="phone-cap">Mobile web · 390 × 844</div>
    </div>
  );
}

/** Inside the phone: report page changes to the parent toolbar. */
function FramePathReporter() {
  const path = usePathname();
  useEffect(() => {
    try { window.parent.postMessage({ type: "ssb-path", path }, window.location.origin); } catch {}
  }, [path]);
  return null;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { panel, device, inFrame } = useStore();
  const path = usePathname();
  useScrollbarSync();

  if (inFrame) {
    return (
      <Stage>
        <FramePathReporter />
        <div className="page">
          <main className="main" key={path}>{children}</main>
        </div>
        <Overlays />
      </Stage>
    );
  }

  const mobile = device === "mweb";
  return (
    <Stage>
      <TopNav />
      <div className="page">
        {mobile ? (
          <main className="main phone-stage"><Phone /></main>
        ) : (
          <main className="main" key={path}>{children}</main>
        )}
        {panel && <Panel />}
      </div>
      {!mobile && <Overlays />}
    </Stage>
  );
}
