"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { SCENARIOS } from "@/lib/scenarios";
import {
  COHORT, CohortLead, currentRound, fmt, HOUR, MIN, PAYOUT_PER_INTERVIEW, State, completedRounds, MAX_ROUNDS,
} from "@/lib/model";
import { Modal } from "./ui";
import { ArrowCounterClockwise, Buildings, CaretDown, CaretLeft, CaretRight, Clock, FlowArrow, Microphone, SquaresFour, UserCircle, X } from "@phosphor-icons/react";

export function useGo() {
  const { load } = useStore();
  const router = useRouter();
  return (id: string) => {
    const sc = SCENARIOS.find((x) => x.id === id);
    if (!sc) return;
    load(id);
    router.push(sc.route);
  };
}

export function TopNav() {
  const path = usePathname();
  const { s, update, reset, scenario, panel, setPanel } = useStore();
  const go = useGo();
  const [clock, setClock] = useState(false);
  const links: [string, string, React.ReactNode][] = [
    ["/", "Flow map", <FlowArrow key="f" size={16} />],
    ["/screens", "All screens", <SquaresFour key="s" size={16} />],
    ["/lead", "Lead dashboard", <UserCircle key="l" size={16} />],
    ["/interviewer", "Interviewer", <Microphone key="i" size={16} />],
    ["/admin", "Admissions CRM", <Buildings key="a" size={16} />],
  ];
  const idx = SCENARIOS.findIndex((x) => x.id === scenario);
  const cur = SCENARIOS[idx];
  const step = (d: number) => {
    const n = idx < 0 ? 0 : (idx + d + SCENARIOS.length) % SCENARIOS.length;
    go(SCENARIOS[n].id);
  };
  const r = currentRound(s);
  const jump = (fn: (ms: number) => number) => { update((d) => (d.now = fn(d.now))); setClock(false); };
  return (
    <header className="topnav">
      <div className="brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ssb-mark.svg" width={22} height={30} alt="" />
        <div>
          <b>SSB · Interview &amp; Offer</b>
          <small>Build scope v2 · interactive prototype</small>
        </div>
      </div>
      <nav className="pillnav">
        {links.map(([h, l, ic]) => (
          <Link key={h} href={h} className={path === h ? "on" : ""}>
            {ic}
            <span className="lbl">{l}</span>
          </Link>
        ))}
      </nav>
      <span className="spacer" />
      <div className="walk" title="Step through every screen in order">
        <button className="arr" onClick={() => step(-1)} aria-label="Previous screen"><CaretLeft size={14} weight="bold" /></button>
        <div className="cur">
          <b>{cur ? `${cur.id} · ${cur.title}` : "Walk through every screen"}</b>
          <span>{cur ? `${idx + 1} of ${SCENARIOS.length} · ${cur.group}` : `${SCENARIOS.length} screens · press → to start`}</span>
        </div>
        <button className="arr" onClick={() => step(1)} aria-label="Next screen"><CaretRight size={14} weight="bold" /></button>
      </div>
      <div style={{ position: "relative" }}>
        <button className={`tool${clock ? " on" : ""}`} onClick={() => setClock(!clock)} aria-expanded={clock}>
          <Clock size={16} /> <span className="lbl">{fmt.dt(s.now)}</span> <CaretDown size={12} />
        </button>
        {clock && (
          <div className="pop" onMouseLeave={() => setClock(false)}>
            <div className="hd">Simulated time</div>
            <button onClick={() => jump((n) => n + HOUR)}>+1 hour</button>
            <button onClick={() => jump((n) => n + 24 * HOUR)}>+1 day</button>
            {r && <button onClick={() => jump(() => r.start - 20 * HOUR)}>20 h before interview (reschedule locks)</button>}
            {r && <button onClick={() => jump(() => r.start - 5 * MIN)}>5 min before interview (join opens)</button>}
            {r && <button onClick={() => jump(() => r.start + 50 * MIN)}>After the interview</button>}
            {s.offer.status === "live" && s.offer.deadline && <button onClick={() => jump(() => (s.offer.deadline ?? 0) + MIN)}>Past the offer deadline</button>}
          </div>
        )}
      </div>
      <button className={`tool toggle${panel ? " on" : ""}`} onClick={() => setPanel(!panel)} aria-pressed={panel}>
        <span className="sw" /> <span className="lbl">Edge cases &amp; stats</span>
      </button>
      <button className="tool" onClick={reset} title="Reset demo"><ArrowCounterClockwise size={16} /></button>
    </header>
  );
}

export function Overlays() {
  const { s, update } = useStore();
  return (
    <>
      {s.ui.modal && <Modal title={s.ui.modal.title} body={s.ui.modal.body} onClose={() => update((d) => (d.ui.modal = null))} />}
      {s.ui.toast && <div className="toast" role="status">{s.ui.toast}</div>}
    </>
  );
}

// ---------------- Edge cases & stats panel ----------------
export function Panel() {
  const { scenario, setPanel } = useStore();
  const go = useGo();
  const [tab, setTab] = useState<"cases" | "stats">("cases");
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const m = new Map<string, typeof SCENARIOS>();
    SCENARIOS.filter((x) => !q || (x.id + x.title + x.rule).toLowerCase().includes(q.toLowerCase())).forEach((x) => {
      m.set(x.group, [...(m.get(x.group) ?? []), x]);
    });
    return [...m];
  }, [q]);
  return (
    <aside className="panel" aria-label="Edge cases and stats">
      <header>
        <div className="row between">
          <h3>Edge cases &amp; stats</h3>
          <button className="btn ghost sm" onClick={() => setPanel(false)} aria-label="Close panel">
            <X size={16} />
          </button>
        </div>
        <div className="tabs" style={{ borderBottom: 0, marginTop: 6 }}>
          <button className={tab === "cases" ? "on" : ""} onClick={() => setTab("cases")}>
            Edge cases ({SCENARIOS.length})
          </button>
          <button className={tab === "stats" ? "on" : ""} onClick={() => setTab("stats")}>
            Stats
          </button>
        </div>
      </header>
      <div className="pbody">
        {tab === "cases" ? (
          <>
            <input className="search" placeholder="Search cases, rules…" value={q} onChange={(e) => setQ(e.target.value)} />
            <p className="small muted">Click a case to load that exact state and open the right screen. Everything stays interactive from there.</p>
            {groups.map(([g, list]) => (
              <div className="ec-group" key={g}>
                <h4>{g}</h4>
                {list.map((x) => (
                  <button
                    key={x.id}
                    className={`ec${scenario === x.id ? " on" : ""}`}
                    onClick={() => go(x.id)}
                  >
                    <span className="id">{x.id}</span>
                    <div>
                      <b>{x.title}</b>
                      <span>{x.rule}</span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </>
        ) : (
          <Stats />
        )}
      </div>
    </aside>
  );
}

function liveLeadAsCohort(s: State): CohortLead {
  const st = s.lead.stage === "approved"
    ? s.offer.status === "accepted" ? "accepted" : s.offer.status === "expired" ? "expired" : s.offer.status === "live" ? "offer_live" : "decision_pending"
    : s.lead.stage;
  return {
    name: s.lead.name,
    stage: st,
    booked: s.lead.rounds.length > 0,
    reschedules: s.lead.reschedules.length,
    noShows: s.lead.noShows,
    rounds: completedRounds(s).length,
    scholarship: s.offer.pct,
    gwFail: s.offer.payments.filter((p) => !p.ok).length,
    owner: s.lead.counsellor.name,
  };
}

function Bar({ label, n, max, suffix = "" }: { label: string; n: number; max: number; suffix?: string }) {
  return (
    <div className="bar">
      <span>{label}</span>
      <div className="track">
        <div className="fill" style={{ width: `${max ? Math.min(100, (n / max) * 100) : 0}%` }} />
      </div>
      <span className="val">
        {n}
        {suffix}
      </span>
    </div>
  );
}

export function Stats() {
  const { s } = useStore();
  const all = [...COHORT, liveLeadAsCohort(s)];
  const N = all.length;
  const count = (f: (x: CohortLead) => boolean) => all.filter(f).length;
  const nonBookers = count((x) => x.stage === "shortlisted" && !x.booked);
  const shortlisted = N;
  const booked = count((x) => x.booked);
  const resTotal = all.reduce((a, x) => a + x.reschedules, 0);
  const reschedulers = count((x) => x.reschedules > 0);
  const maxRes = Math.max(...all.map((x) => x.reschedules));
  const noShows = all.reduce((a, x) => a + x.noShows, 0);
  const offers = all.filter((x) => ["offer_live", "accepted", "expired"].includes(x.stage));
  const accepted = count((x) => x.stage === "accepted");
  const sch = offers.map((x) => x.scholarship ?? 0);
  const avgSch = sch.length ? sch.reduce((a, b) => a + b, 0) / sch.length : 0;
  const gwFails = all.reduce((a, x) => a + x.gwFail, 0);
  const roundsDist = [1, 2, 3, 4].map((n) => count((x) => x.rounds === n));
  const ivCompleted = s.iv.completedBefore + completedRounds(s).filter((r) => r.iv === "Karan Shah").length;
  const stages: [string, (x: CohortLead) => boolean][] = [
    ["Shortlisted, not booked", (x) => x.stage === "shortlisted"],
    ["Booked / in rounds", (x) => ["booked", "round_done"].includes(x.stage)],
    ["No-show (to reopen)", (x) => x.stage === "no_show"],
    ["Decision pending", (x) => x.stage === "decision_pending"],
    ["Waitlisted", (x) => x.stage === "waitlisted"],
    ["Rejected", (x) => x.stage === "rejected"],
    ["Offer live", (x) => x.stage === "offer_live"],
    ["Offer expired", (x) => x.stage === "expired"],
    ["Accepted", (x) => x.stage === "accepted"],
  ];
  const nbPct = Math.round((nonBookers / shortlisted) * 100);
  return (
    <>
      <p className="small muted">
        Mock cohort of {N - 1} leads plus your live demo lead ({s.lead.name}) — her numbers update as you click through.
      </p>
      <div className="minis">
        <div className={`mini${nbPct >= 15 ? " warn" : ""}`}>
          <div className="k">Non-bookers</div>
          <div className="v">{nbPct}%</div>
          <div className="d">{nonBookers} of {shortlisted} shortlisted · threshold for a booking deadline is TBD</div>
        </div>
        <div className="mini">
          <div className="k">Booking rate</div>
          <div className="v">{Math.round((booked / N) * 100)}%</div>
          <div className="d">{booked} booked a slot</div>
        </div>
        <div className="mini">
          <div className="k">Reschedules (no fee yet)</div>
          <div className="v">{resTotal}</div>
          <div className="d">{reschedulers} leads · max {maxRes} by one lead · {s.lead.first}: {s.lead.reschedules.length}</div>
        </div>
        <div className="mini">
          <div className="k">No-shows (no fee yet)</div>
          <div className="v">{noShows}</div>
          <div className="d">{((noShows / Math.max(1, booked)) * 100).toFixed(1)}% of booked</div>
        </div>
        <div className="mini">
          <div className="k">Offer → accepted</div>
          <div className="v">{offers.length ? Math.round((accepted / offers.length) * 100) : 0}%</div>
          <div className="d">{accepted} of {offers.length} offers</div>
        </div>
        <div className="mini">
          <div className="k">Avg scholarship</div>
          <div className="v">{avgSch.toFixed(1)}%</div>
          <div className="d">deducted from tuition only</div>
        </div>
        <div className="mini">
          <div className="k">Gateway failures</div>
          <div className="v">{gwFails}</div>
          <div className="d">PhonePe → Razorpay fallback used</div>
        </div>
        <div className="mini">
          <div className="k">Interviewer payout (Karan)</div>
          <div className="v">{fmt.money(ivCompleted * PAYOUT_PER_INTERVIEW)}</div>
          <div className="d">{ivCompleted} completed × ₹700 · this month</div>
        </div>
      </div>
      <div className="ec-group">
        <h4>Funnel by state</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {stages.map(([l, f]) => (
            <Bar key={l} label={l} n={count(f)} max={N} />
          ))}
        </div>
      </div>
      <div className="ec-group">
        <h4>Rounds completed per lead (cap {MAX_ROUNDS})</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {roundsDist.map((n, i) => (
            <Bar key={i} label={`${i + 1} round${i ? "s" : ""}`} n={n} max={N} />
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 6 }}>General mode is 1–2 rounds; R3/R4 should stay rare.</p>
      </div>
      <div className="ec-group">
        <h4>Reschedules per lead (instrumented for the fee call)</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[0, 1, 2, 3].map((n) => (
            <Bar key={n} label={n === 3 ? "3+ times" : `${n} time${n === 1 ? "" : "s"}`} n={count((x) => (n === 3 ? x.reschedules >= 3 : x.reschedules === n) && x.booked)} max={booked} />
          ))}
        </div>
      </div>
      <div className="ec-group">
        <h4>Live lead · {s.lead.name}</h4>
        <div className="kv">
          <div><span>Stage</span><b>{s.lead.stage.replace("_", " ")}</b></div>
          <div><span>Round</span><b>{s.lead.round} of max {MAX_ROUNDS}</b></div>
          <div><span>Reschedules</span><b>{s.lead.reschedules.length}</b></div>
          <div><span>No-shows</span><b>{s.lead.noShows}</b></div>
          <div><span>Counsellor unblocks</span><b>{s.lead.unblocks}</b></div>
          <div><span>Offer</span><b>{s.offer.status}{s.offer.version ? ` · v${s.offer.version}` : ""}</b></div>
          <div><span>Emails sent</span><b>{s.emails.length}</b></div>
        </div>
      </div>
    </>
  );
}
