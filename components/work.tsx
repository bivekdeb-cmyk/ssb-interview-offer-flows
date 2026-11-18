"use client";
import React from "react";
import { CaretDown } from "@phosphor-icons/react";
import { Avatar, Logo } from "./ui";

export function WorkShell({
  user, avatar, label, nav, active, onNav, footer, headerRight, children,
}: {
  anno?: string; note?: string; user: string; avatar?: string; label: string;
  nav: { id: string; label: string; icon?: React.ReactNode; count?: number | string }[]; active: string; onNav: (id: string) => void;
  footer: string; headerRight?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="frame">
      <div className="appnav">
        <Logo />
        <div className="menu">
          {headerRight}
          {avatar ? <Avatar src={avatar} /> : <span className="avatar">{user.split(" ").map((x) => x[0]).join("").slice(0, 2)}</span>}
          <span className="nav-profile">{user} <CaretDown size={14} className="muted" /></span>
        </div>
      </div>
      {/* mobile: horizontal section tabs (sidebar is hidden on small screens) */}
      <nav className="mnav" aria-label={label}>
        {nav.map((n) => (
          <button key={n.id} className={active === n.id ? "on" : ""} onClick={() => onNav(n.id)}>
            {n.icon}
            {n.label}
            {n.count !== undefined && n.count !== 0 && <span className="cnt">{n.count}</span>}
          </button>
        ))}
      </nav>
      <div className="ws">
        <aside className="side">
          <div className="lbl">{label}</div>
          <div className="navlist">
            {nav.map((n) => (
              <button key={n.id} className={active === n.id ? "on" : ""} onClick={() => onNav(n.id)}>
                <span className="row" style={{ gap: 10 }}>{n.icon}{n.label}</span>
                {n.count !== undefined && <span className="cnt">{n.count}</span>}
              </button>
            ))}
          </div>
        </aside>
        <div className="content">
          {children}
          <div className="foot"><span>{footer}</span><span>Privacy policy</span></div>
        </div>
      </div>
    </div>
  );
}
