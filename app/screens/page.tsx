"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Buildings, MagnifyingGlass, Microphone, UserCircle } from "@phosphor-icons/react";
import { SCENARIOS, Scenario } from "@/lib/scenarios";
import { useGo } from "@/components/chrome";
import { useStore } from "@/lib/store";

const VIEW: Record<Scenario["route"], [string, React.ReactNode]> = {
  "/lead": ["Lead dashboard", <UserCircle key="l" size={14} />],
  "/interviewer": ["Interviewer platform", <Microphone key="i" size={14} />],
  "/admin": ["Admissions CRM", <Buildings key="a" size={14} />],
};
const GROUP_DESC: Record<string, string> = {
  "Flow A · Lead": "What the candidate sees from shortlist to verdict — booking, prep, reschedule, no-show, rounds, waitlist and reject.",
  "Interviewer platform": "Contractor interviewers — onboarding, self-serve slots, feedback and payouts.",
  "Admissions / CRM": "Counsellor tooling — booking control, the full lead card, unblocking stuck leads, pools.",
  "Flow B · Admin": "Approval, scholarship rubric and guardrails, letter preview/send, offer tracking.",
  "Flow B · Lead": "Offer email and dashboard, payment with backup gateway, expiry, revision, acceptance and onboarding.",
};

export default function ScreensPage() {
  const go = useGo();
  const { scenario } = useStore();
  const [q, setQ] = useState("");
  const [view, setView] = useState<"all" | Scenario["route"]>("all");
  const groups = useMemo(() => {
    const m = new Map<string, Scenario[]>();
    SCENARIOS.filter((x) => (view === "all" || x.route === view) && (!q || (x.id + x.title + x.rule).toLowerCase().includes(q.toLowerCase()))).forEach((x) =>
      m.set(x.group, [...(m.get(x.group) ?? []), x]),
    );
    return [...m];
  }, [q, view]);
  return (
    <div className="gallery">
      <div className="gallery-head">
        <div>
          <h1>All screens</h1>
          <p className="muted">Every screen and edge case from the build scope. Click any card to open it with the right data loaded — then use ‹ › in the top bar to step through them in order.</p>
        </div>
        <div className="row">
          <div className="seg">
            {(["all", "/lead", "/interviewer", "/admin"] as const).map((v) => (
              <button key={v} className={view === v ? "on" : ""} onClick={() => setView(v)}>
                {v === "all" ? `All · ${SCENARIOS.length}` : `${VIEW[v][0]} · ${SCENARIOS.filter((x) => x.route === v).length}`}
              </button>
            ))}
          </div>
          <label className="searchbox">
            <MagnifyingGlass size={16} />
            <input placeholder="Search e.g. reschedule, waitlist, payment" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
      </div>
      {groups.map(([g, list]) => (
        <section key={g} className="gal-group">
          <div className="gal-title">
            <h2>{g}</h2>
            <span className="muted">{GROUP_DESC[g]}</span>
          </div>
          <div className="gal-grid">
            {list.map((x) => (
              <button key={x.id} className={`gal-card${scenario === x.id ? " on" : ""}`} onClick={() => go(x.id)}>
                <div className="row between">
                  <span className="gal-id">{x.id}</span>
                  <span className="gal-view">{VIEW[x.route][1]} {VIEW[x.route][0]}</span>
                </div>
                <b>{x.title}</b>
                <span className="muted small">{x.rule}</span>
                <span className="gal-open">Open screen <ArrowRight size={14} weight="bold" /></span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {groups.length === 0 && <p className="muted">No screens match “{q}”.</p>}
    </div>
  );
}
