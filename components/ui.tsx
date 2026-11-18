"use client";
import React from "react";

type Tone = "green" | "amber" | "red" | "gray" | "blue" | "dark";

export function Btn({ kind = "primary", sm, children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "primary" | "secondary" | "ghost" | "danger" | "light" | "outline-w"; sm?: boolean }) {
  return (
    <button {...p} className={`btn ${kind}${sm ? " sm" : ""} ${p.className ?? ""}`}>
      {children}
    </button>
  );
}

export function Tag({ tone = "green", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`tag t-${tone}`}>{children}</span>;
}

export function Notice({ tone = "green", title, children }: { tone?: Tone; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className={`notice t-${tone}`}>
      <i className="dot" />
      <div>
        <b>{title}</b>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}

export function Card({ title, sub, eyebrow, children, className, right }: { title?: React.ReactNode; sub?: React.ReactNode; eyebrow?: string; children?: React.ReactNode; className?: string; right?: React.ReactNode }) {
  return (
    <section className={`card ${className ?? ""}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      {(title || sub || right) && (
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <div>
            {title && <h3>{title}</h3>}
            {sub && <p className="sub">{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function KV({ rows }: { rows: [React.ReactNode, React.ReactNode, string?][] }) {
  return (
    <div className="kv">
      {rows.map(([a, b, cls], i) => (
        <div key={i} className={cls}>
          <span>{a}</span>
          <b>{b}</b>
        </div>
      ))}
    </div>
  );
}

export function Intro({ title, sub, status, tone }: { title: React.ReactNode; sub?: React.ReactNode; status?: string; tone?: Tone }) {
  return (
    <div className="intro">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {status && <Tag tone={tone}>{status}</Tag>}
    </div>
  );
}

export function Field({ label, req, help, err, children }: { label: string; req?: boolean; help?: string; err?: string | false; children: React.ReactNode }) {
  return (
    <div className={`field${err ? " err" : ""}`}>
      <label>
        {label}
        {req && <span style={{ color: "var(--red)" }}> *</span>}
      </label>
      {children}
      {(err || help) && <span className="help">{err || help}</span>}
    </div>
  );
}

export function Logo() {
  return (
    <div className="logo" aria-label="Scaler School of Business">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/ssb-mark.svg" width={29} height={40} alt="" />
      <div className="t">
        SCALER
        <br />
        SCHOOL<sup style={{ fontSize: 6, marginLeft: 1 }}>OF</sup>
        <br />
        BUSINESS
      </div>
    </div>
  );
}

export type IllusName = "clock" | "certificate" | "broken-link";
/** Brand illustrations: clock = waiting/time, certificate = offer/letters, broken-link = expired/failed/missed. */
export function Illus({ name, size = 200 }: { name: IllusName; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="illus" src={`/illus/${name}.png`} alt="" width={size} height={size} />;
}

/** Card with copy on the left and an illustration on the right. */
export function IllusCard({ name, title, sub, children, size = 190, tint }: { name: IllusName; title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode; size?: number; tint?: boolean }) {
  return (
    <section className={`card illus-card${tint ? " tint" : ""}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <h3 style={{ fontSize: 22 }}>{title}</h3>
          {sub && <p className="sub" style={{ fontSize: 14, marginTop: 6 }}>{sub}</p>}
        </div>
        {children}
      </div>
      <Illus name={name} size={size} />
    </section>
  );
}

export function Avatar({ src, size = 34 }: { src: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={size} height={size} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
}

export function Modal({ title, body, onClose }: { title: string; body: string[]; onClose: () => void }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <h3 style={{ fontSize: 18 }}>{title}</h3>
        {body.map((b, i) => (
          <p key={i} className={i === 0 ? "" : "muted"} style={{ fontSize: 14 }}>
            {b}
          </p>
        ))}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <Btn onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}
