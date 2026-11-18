"use client";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { SCENARIOS } from "@/lib/scenarios";
import { Tag } from "@/components/ui";

type N = { t: string; d: string; go?: string; cls?: string };
type Step = { n: string; q?: boolean; main: N; sides?: N[]; arrow?: string };

const FLOW_A: Step[] = [
  { n: "1", main: { t: "Interviewer platform shares slots", d: "Mentor-dashboard reuse · onboarding + contract · self-serve add/remove · ₹700 per completed", go: "I2" } },
  { n: "2", main: { t: "Counsellor shortlists on CRM", d: "Email: “status updated — check your dashboard”", go: "A1" } },
  { n: "3", main: { t: "Candidate books own slot", d: "Next 3 days visible · 3-3-3 · FOMO UI · no deadline for now · non-bookers tracked", go: "A2" }, sides: [{ t: "Window exhausted → next 3", d: "Visible days set in admin tool", go: "A3", cls: "side" }, { t: "No interviewer supply", d: "Holding state + callback", go: "A4", cls: "side" }] },
  { n: "4", main: { t: "Confirmation screen", d: "Join link · calendar · prep kit · AI mock (Anshuman voice) · request-callback", go: "A5" }, sides: [{ t: "Reschedule — free for now", d: "≥24 h before · reason mandatory · doc optional · per-user count", go: "A6", cls: "side" }, { t: "<24 h → locked", d: "Contact counsellor instead", go: "A7", cls: "side" }] },
  { n: "5", main: { t: "Interview — Google Meet, 30 min + 15 buffer", d: "Auto-record → transcript + summary → CRM", go: "A11" }, sides: [{ t: "No-show", d: "No fee · counsellor reopens & rebooks", go: "A10", cls: "side" }, { t: "Interviewer bails", d: "Re-offer slots + notify lead", go: "A9", cls: "side" }] },
  { n: "6", main: { t: "Feedback in interviewer portal", d: "Per-question + yes/no verdict → CRM · gates “completed”", go: "I3" } },
  { n: "?", q: true, main: { t: "Another round? (max 4)", d: "R2–R4 for second/third opinion or intent-led push", go: "A12" }, sides: [{ t: "Cap reached at R4", d: "Only path left is final verdict", go: "A13", cls: "side" }], arrow: "no" },
  { n: "8", main: { t: "Final verdict — Adhiraj / Vidit", d: "Sales can advocate borderline profiles on intent", go: "A14" } },
];
const A_OUT: N[] = [
  { t: "Approved → O2A offer flow", d: "Next stage", go: "O4", cls: "ok" },
  { t: "Waitlist — borderline", d: "In funnel · no reapply · can update profile · reviewed each round", go: "A15", cls: "wl" },
  { t: "Reject — worst profiles", d: "Reapply after ~1-month cooldown, full app fee · late cohort → waitlist", go: "A17", cls: "rj" },
];
const FLOW_B: Step[] = [
  { n: "1", main: { t: "≥2 rounds completed", d: "Full lead card on CRM: rounds, verdicts, feedback, CTC, LinkedIn, VE", go: "C2" }, sides: [{ t: "Only 1 round → blocked", d: "Approval disabled until 2 rounds", go: "O1", cls: "side" }] },
  { n: "?", q: true, main: { t: "“Approved for offer” — CRM activity", d: "Reserved: Adhiraj / Vidit only", go: "O2" }, sides: [{ t: "Escalate — Vidit", d: "Override → offer proceeds · else waitlist / reject", go: "O3", cls: "side" }], arrow: "yes" },
  { n: "3", main: { t: "Scholarship module", d: "Rubric 5×0–2 → tier → % · counsellor ±5% · deducts from tuition, never admission fee", go: "O4" }, sides: [{ t: ">5% change", d: "Needs logged Vidit approval", go: "O5", cls: "side" }] },
  { n: "4", main: { t: "Letters auto-generated", d: "Provisional admission + scholarship letter · official SSB ID · preview/audit", go: "O6" } },
  { n: "5", main: { t: "Email + dashboard in sync", d: "No delta in time", go: "L1" } },
  { n: "6", main: { t: "Payment on dashboard", d: "PhonePe primary + Razorpay backup · timer default 7 days, counsellor-settable", go: "L2" }, sides: [{ t: "PhonePe fails", d: "Razorpay backup inline", go: "L4", cls: "side" }, { t: "In parallel", d: "Counsellor + leadership calls · campus visits", cls: "side" }] },
  { n: "?", q: true, main: { t: "Paid by deadline?", d: "", go: "L3" }, sides: [{ t: "Expired → counsellor action", d: "Resend · extend · change scholarship · no auto-waitlist", go: "L5", cls: "side" }, { t: "Revised offer", d: "New link + revised letter + history", go: "L6", cls: "side" }], arrow: "yes" },
  { n: "8", main: { t: "Accepted — admission fee paid", d: "Auto-marked on reconciliation", go: "L7", cls: "ok" } },
  { n: "9", main: { t: "Congratulations + onboarding form", d: "From Shan + Adhiraj · loan-takers: financial-docs sub-flow → CRM", go: "L8" }, sides: [{ t: "FBM applicant", d: "No salary slips / last-org fields", go: "L9", cls: "side" }] },
];

export default function Overview() {
  const { load } = useStore();
  const router = useRouter();
  const go = (id?: string) => {
    if (!id) return;
    const sc = SCENARIOS.find((x) => x.id === id);
    if (!sc) return;
    load(id);
    router.push(sc.route);
  };
  const Node = ({ x }: { x: N }) =>
    x.go ? (
      <button className={`fnode ${x.cls ?? ""}`} onClick={() => go(x.go)}>
        <b>{x.t}</b>
        {x.d && <span>{x.d}</span>}
        <em>Open {x.go} →</em>
      </button>
    ) : (
      <div className={`fnode ${x.cls ?? ""}`}>
        <b>{x.t}</b>
        <span>{x.d}</span>
      </div>
    );
  const Flow = ({ steps, out }: { steps: Step[]; out?: N[] }) => (
    <>
      {steps.map((st, i) => (
        <div key={i}>
          <div className="fstep">
            <div className={`n${st.q ? " q" : ""}`}>
              <span>{st.n}</span>
            </div>
            <div className="fbody">
              <Node x={st.main} />
              {st.sides && (
                <div className="fsides">
                  {st.sides.map((x, j) => (
                    <Node key={j} x={x} />
                  ))}
                </div>
              )}
            </div>
          </div>
          {(i < steps.length - 1 || out) && <div className="arrow">{st.arrow}</div>}
        </div>
      ))}
      {out && (
        <div className="grid3" style={{ paddingLeft: 44 }}>
          {out.map((x, i) => (
            <Node key={i} x={x} />
          ))}
        </div>
      )}
    </>
  );
  return (
    <div className="ov">
      <div>
        <Tag tone="green">Source of truth · SSB Interview &amp; Offer Flow + Dashboard Build Scope (v2)</Tag>
        <h1 style={{ marginTop: 12 }}>Interview &amp; offer flows, end to end</h1>
        <p className="lead">
          Every box is clickable — it loads that exact state into the prototype and opens the right screen (lead dashboard, interviewer platform or admissions CRM). Turn on <b>Edge cases &amp; stats</b> in the top bar to browse all {SCENARIOS.length} cases and the cohort metrics.
        </p>
      </div>
      <div className="flows">
        <section className="flow">
          <Tag tone="gray">FLOW A</Tag>
          <h2>Interview, end to end</h2>
          <p className="muted" style={{ marginBottom: 12 }}>Up to 4 rounds, one verdict — reject for worst profiles, waitlist for borderline · no fees in the flow for now</p>
          <Flow steps={FLOW_A} out={A_OUT} />
        </section>
        <section className="flow">
          <Tag tone="gray">FLOW B</Tag>
          <h2>Offer → acceptance, end to end</h2>
          <p className="muted" style={{ marginBottom: 12 }}>One approval, one rubric — approval lives on CRM, email and dashboard in sync</p>
          <Flow steps={FLOW_B} />
        </section>
      </div>
      <div className="grid2">
        <section className="flow">
          <h2 style={{ fontSize: 18 }}>State models</h2>
          <p className="small muted">Interview states</p>
          <div className="states">
            <Tag>Booked (self-serve)</Tag><span className="arr">→</span><Tag tone="amber">Rescheduled (≤24 h, free, loop)</Tag><span className="arr">→</span><Tag>Completed (gated on feedback)</Tag><span className="arr">·</span><Tag tone="red">No-show (counsellor reopen)</Tag>
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>Lead states</p>
          <div className="states">
            <Tag tone="gray">Shortlisted</Tag><span className="arr">→</span><Tag tone="gray">R1…R4</Tag><span className="arr">→</span><Tag tone="gray">Decision pending</Tag><span className="arr">→</span><Tag>Approved for offer</Tag><Tag tone="blue">Waitlisted</Tag><Tag tone="red">Rejected (cooldown)</Tag>
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>Offer states</p>
          <div className="states">
            {["Approval pending", "Approved / Escalated", "Scholarship set", "Letters live", "Active", "Expired", "Extended / Revised", "Accepted (paid)", "Onboarding"].map((x, i, a) => (
              <span key={x} className="row" style={{ gap: 6 }}>
                <Tag tone={x === "Expired" ? "red" : x.startsWith("Accepted") ? "green" : "gray"}>{x}</Tag>
                {i < a.length - 1 && <span className="arr">→</span>}
              </span>
            ))}
          </div>
        </section>
        <section className="flow">
          <h2 style={{ fontSize: 18 }}>Guardrails &amp; open decisions [TBD]</h2>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <li><b>Fees (reschedule / no-show)</b> — parked; instrument per-user reschedules and no-shows this cohort, then decide. ₹100–500 not agreed.</li>
            <li><b>Non-booker threshold</b> — at what % shortlisted-not-booked do we add a booking deadline/timer (see Stats).</li>
            <li><b>Mentor-dashboard fit</b> for interviewer platform (browser/device; Drona on Safari) — Ajay.</li>
            <li><b>CRM-native transcript + audit pipeline</b> feasibility — Ajay checking.</li>
            <li><b>Onboarding-form field list</b> — Shan + Adhiraj (fields shown here are placeholders).</li>
            <li><b>Waitlist revisit cadence</b> — round-wise agreed; exact trigger undefined.</li>
            <li><b>Two application flows</b> — main MBA vs FBM (no salary slips / last-org fields).</li>
            <li><b>SMT stays for the full cohort</b> — deadline compression fine; cutting steps mid-cohort is not.</li>
          </ul>
          <p className="small muted">Illustrative values used in the prototype (not in the scope doc): fee amounts, rubric metric names, tier → % table, interviewer names.</p>
        </section>
      </div>
    </div>
  );
}
