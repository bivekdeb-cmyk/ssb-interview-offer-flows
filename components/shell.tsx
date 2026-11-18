"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { Overlays, Panel, TopNav } from "./chrome";

/** Full-window app frame: the page never scrolls, only inner panes do. */
function Stage({ children }: { children: React.ReactNode }) {
  return <div className="stage">{children}</div>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { panel } = useStore();
  const path = usePathname();

  // Keep the navbar's right edge aligned with the content column (offset by the content scrollbar width).
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


  return (
    <Stage>
      <TopNav />
      <div className="page">
        <main className="main" key={path}>
          {children}
        </main>
        {panel && <Panel />}
      </div>
      <Overlays />
    </Stage>
  );
}
