"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  approve, bookingWindow, COHORT, completedRounds, currentRound, DAY, escalate, extendOffer, FEES, FEEDBACK_QS, fmt, interviewerBail,
  INTERVIEW_MIN, MAX_ROUNDS, MIN, MIN_ROUNDS_FOR_OFFER, markNoShow, nextRound, reject, reopenBooking, resendOffer, Role, RUBRIC,
  saveScholarship, scholarship, sendOffer, State, TIERS, toFinal, uphold, waitlist, COOLDOWN_DAYS, UI, email, act,
} from "@/lib/model";
import { Btn, Card, Field, IllusCard, Intro, KV, Notice, Tag } from "@/components/ui";
import { AddressBook, CalendarDots, EnvelopeSimple, GearSix, Medal, Timer, UsersThree } from "@phosphor-icons/react";
import { WorkShell } from "@/components/work";
import { IMG } from "@/lib/images";

const ROLE_NAME: Record<Role, string> = { counsellor: "Riya Kapoor · Counsellor", adhiraj: "Adhiraj · Final verdict", vidit: "Vidit · Escalation" };
const who = (s: State) => (s.role === "counsellor" ? "Riya Kapoor" : s.role === "adhiraj" ? "Adhiraj" : "Vidit");

const STAGE_TAG: Record<string, [string, "green" | "amber" | "red" | "gray" | "blue"]> = {
  shortlisted: ["Shortlisted", "gray"], booked: ["Booked", "green"], round_done: ["Round complete", "amber"], no_show: ["No-show", "red"],
  decision_pending: ["Decision pending", "amber"], waitlisted: ["Waitlisted", "blue"], rejected: ["Rejected", "red"], approved: ["Approved for offer", "green"],
  offer_live: ["Offer live", "green"], accepted: ["Accepted", "green"], expired: ["Offer expired", "red"],
};

export default function AdminPage() {
  const { s, update } = useStore();
  const tab = s.ui.adTab;
  return (
    <WorkShell
      anno={`Admissions · CRM · ${({ pipeline: "Pipeline & pools", lead: "Lead card", booking: "Booking control", scholarship: "Scholarship module", letters: "Letters & send", tracking: "Offer tracking", settings: "Settings" } as Record<string, string>)[tab]}`}
      note="CRM is the single source of truth · no Slack, no O2A sheet"
      user={ROLE_NAME[s.role]}
      avatar={s.role === "counsellor" ? IMG.counsellor : undefined}
      label="ADMISSIONS WORKSPACE"
      headerRight={
        <select className="search" style={{ width: 210 }} value={s.role} onChange={(e) => update((d) => (d.role = e.target.value as Role))} aria-label="Acting as">
          <option value="counsellor">Acting as: Counsellor</option>
          <option value="adhiraj">Acting as: Adhiraj</option>
          <option value="vidit">Acting as: Vidit</option>
        </select>
      }
      nav={[
        { id: "pipeline", label: "Pipeline & pools", icon: <UsersThree size={18} />, count: COHORT.length + 1 },
        { id: "lead", label: `Lead · ${s.lead.name}`, icon: <AddressBook size={18} /> },
        { id: "booking", label: "Booking control", icon: <CalendarDots size={18} /> },
        { id: "scholarship", label: "Scholarship", icon: <Medal size={18} /> },
        { id: "letters", label: "Letters & send", icon: <EnvelopeSimple size={18} /> },
        { id: "tracking", label: "Offer tracking", icon: <Timer size={18} /> },
        { id: "settings", label: "Settings", icon: <GearSix size={18} /> },
      ]}
      active={tab}
      onNav={(id) => update((d) => (d.ui.adTab = id as UI["adTab"]))}
      footer="SSB Admissions · Admissions workspace (CRM)"
    >
      {tab === "pipeline" && <Pipeline />}
      {tab === "lead" && <LeadCard />}
      {tab === "booking" && <Booking />}
      {tab === "scholarship" && <Scholarship />}
      {tab === "letters" && <Letters />}
      {tab === "tracking" && <Tracking />}
      {tab === "settings" && <Settings />}
    </WorkShell>
  );
}

function liveStage(s: State) {
  if (s.lead.stage !== "approved") return s.lead.stage;
  return s.offer.status === "accepted" ? "accepted" : s.offer.status === "expired" ? "expired" : s.offer.status === "live" ? "offer_live" : "approved";
}

// ---------------- Pipeline ----------------
function Pipeline() {
  const { s, update } = useStore();
  const [f, setF] = useState<"all" | "nonbook" | "waitlist" | "reject" | "noshow">("all");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const rows = [{ name: s.lead.name, stage: liveStage(s), booked: s.lead.rounds.length > 0, reschedules: s.lead.reschedules.length, noShows: s.lead.noShows, rounds: completedRounds(s).length, owner: s.lead.counsellor.name, live: true }, ...COHORT.map((x) => ({ ...x, live: false }))];
  const filt = rows.filter((x) => f === "all" || (f === "nonbook" && x.stage === "shortlisted") || (f === "waitlist" && x.stage === "waitlisted") || (f === "reject" && x.stage === "rejected") || (f === "noshow" && x.stage === "no_show"));
  const c = (st: string) => rows.filter((x) => x.stage === st).length;
  return (
    <>
      <Intro title="Pipeline & pools" sub="Every lead’s state lives on its CRM record. Any stuck lead can be unblocked by a counsellor without tech." />
      <div className="grid4">
        <div className="stat"><div className="k">Shortlisted, not booked</div><div className="v">{c("shortlisted")}</div><div className="d">non-bookers tracked</div></div>
        <div className="stat"><div className="k">In interview rounds</div><div className="v">{c("booked") + c("round_done")}</div></div>
        <div className="stat"><div className="k">Waitlist pool</div><div className="v">{c("waitlisted")}</div><div className="d">reviewed each round</div></div>
        <div className="stat"><div className="k">Reject pool</div><div className="v">{c("rejected")}</div><div className="d">{COOLDOWN_DAYS}-day cooldown</div></div>
      </div>
      <div className="tabs">
        {([["all", "All leads"], ["nonbook", "Non-bookers"], ["noshow", "No-shows"], ["waitlist", "Waitlist pool"], ["reject", "Reject pool"]] as const).map(([k, l]) => (
          <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}</button>
        ))}
      </div>
      {f === "waitlist" && <Notice tone="blue" title="Waitlist pool">Borderline profiles stay in funnel, can’t reapply, can update their profile, and are reviewed every round. Exact revisit trigger is TBD.</Notice>}
      {f === "reject" && <Notice tone="red" title="Reject pool">Worst profiles only. Reapply after ~1 month at full application fee. Late in cohort → waitlist instead.</Notice>}
      <table className="tbl">
        <thead><tr><th>Lead</th><th>State</th><th>Rounds</th><th>Reschedules</th><th>No-shows</th><th>Owner</th><th>{f === "waitlist" ? "Nurture note" : ""}</th></tr></thead>
        <tbody>
          {filt.map((x) => (
            <tr key={x.name} style={x.live ? { background: "var(--tint)" } : {}}>
              <td><b>{x.name}</b>{x.live && <div className="small muted">Live demo lead</div>}</td>
              <td><Tag tone={STAGE_TAG[x.stage]?.[1] ?? "gray"}>{STAGE_TAG[x.stage]?.[0] ?? x.stage}</Tag></td>
              <td>{x.rounds}</td>
              <td>{x.reschedules}</td>
              <td>{x.noShows}</td>
              <td>{x.owner}</td>
              <td>
                {x.live ? <Btn sm kind="secondary" onClick={() => update((d) => (d.ui.adTab = "lead"))}>Open card</Btn> : f === "waitlist" ? (
                  <input className="search" placeholder="Add nurture note" value={notes[x.name] ?? ""} onChange={(e) => setNotes({ ...notes, [x.name]: e.target.value })} />
                ) : f === "nonbook" ? <Btn sm kind="ghost" onClick={() => update((d) => (d.ui.toast = `Nudge sent to ${x.name}: “status updated — check your dashboard”`))}>Nudge</Btn> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ---------------- Lead card ----------------
function LeadCard() {
  const { s, update } = useStore();
  const L = s.lead;
  const r = currentRound(s);
  const done = completedRounds(s);
  const st = liveStage(s);
  const canReserve = s.role === "adhiraj" || s.role === "vidit";
  return (
    <>
      <div className="intro">
        <div>
          <h1>{L.name}</h1>
          <p>{L.id} · Owner {L.counsellor.name} · Round {L.round} of max {MAX_ROUNDS}</p>
        </div>
        <Tag tone={STAGE_TAG[st]?.[1]}>{STAGE_TAG[st]?.[0]}</Tag>
      </div>
      <div className="split">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Actions />
          <Card title="Round history" sub={`${done.length} completed · cap ${MAX_ROUNDS} · general mode 1–2`}>
            {L.rounds.length === 0 && <span className="muted small">No rounds yet — lead hasn’t booked.</span>}
            {L.rounds.map((x, i) => (
              <div key={i} className="card" style={{ padding: 16, gap: 10 }}>
                <div className="row between">
                  <b>Round {x.n} · {x.iv}</b>
                  <Tag tone={x.status === "completed" ? "green" : x.status === "no_show" ? "red" : x.status === "cancelled" ? "gray" : "amber"}>
                    {x.status === "completed" ? `Completed · ${x.feedback?.verdict === "yes" ? "Yes" : "No"}` : x.status === "no_show" ? "No-show" : x.status === "cancelled" ? "Interviewer bailed" : "Booked"}
                  </Tag>
                </div>
                <span className="small muted">{fmt.dt(x.start)} IST · {x.meet}</span>
                {x.feedback && (
                  <>
                    <div className="grid3" style={{ gap: 6 }}>
                      {FEEDBACK_QS.map((q, j) => (
                        <div key={q} className="small"><span className="muted">{q}</span> <b>{x.feedback!.scores[j]}/5</b></div>
                      ))}
                    </div>
                    {x.feedback.remark && <span className="small">“{x.feedback.remark}”</span>}
                    <div className="reserved small"><b>Transcript summary</b> · {x.summary}</div>
                  </>
                )}
              </div>
            ))}
          </Card>
          <Card title="CRM activity" sub="Reserved activities are highlighted">
            <div className="timeline">
              {s.activity.slice(0, 18).map((a, i) => (
                <div className="tl-item" key={i}>
                  <span className="when">{fmt.dt(a.at)}</span>
                  <span className={a.reserved ? "reserved" : ""}><span className="who">{a.who}</span> · {a.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card title="Profile">
            <KV rows={[["CTC", L.ctc], ["LinkedIn", L.linkedin], ["VE", L.ve], ["Reschedules", `${L.reschedules.length} (no fee yet)`], ["No-shows", String(L.noShows)], ["Unblocks", String(L.unblocks)]]} />
          </Card>
          {L.reschedules.length > 0 && (
            <Card title="Reschedule log" sub="Instrumented per user for the fee decision">
              {L.reschedules.map((x, i) => (
                <div key={i} className="small"><b>#{i + 1}</b> {fmt.dt(x.from)} → {fmt.dt(x.to)} · {x.reason}</div>
              ))}
              {L.reschedules.length >= 3 && <Notice tone="amber" title="Frequent rescheduler">Still free under current policy — flagged for the fee call.</Notice>}
            </Card>
          )}
          {L.profileUpdates.length > 0 && (
            <Card title="Waitlist profile updates">
              {L.profileUpdates.map((u, i) => <div key={i} className="small"><b>{fmt.date(u.at)}</b> · {u.note}</div>)}
            </Card>
          )}
          <Card title="Permissions">
            <span className="small muted">“Approved for offer” is a reserved activity — {canReserve ? `you (${who(s)}) can add it.` : "only Adhiraj or Vidit can add it. Switch role in the header to try."}</span>
          </Card>
          {r && <Card title="Booked interview"><KV rows={[["When", fmt.dt(r.start)], ["Interviewer", r.iv], ["Meet", r.meet]]} /></Card>}
        </div>
      </div>
    </>
  );
}

function Actions() {
  const { s, update } = useStore();
  const L = s.lead;
  const r = currentRound(s);
  const by = who(s);
  const done = completedRounds(s).length;
  const canReserve = s.role === "adhiraj" || s.role === "vidit";
  switch (L.stage) {
    case "shortlisted":
      return (
        <Card title="Waiting for the lead to book" sub={`Round ${L.round} · non-booker until a slot is picked. No booking deadline for now.`} className="tint">
          <div className="row">
            <Btn kind="secondary" onClick={() => update((d) => { email(d, "Your application status has been updated", [`Hi ${d.lead.first}, a reminder to book your interview slot.`, "Slots are filling fast — check your dashboard."], "Book a slot", "Nudge"); act(d, by, "Booking nudge sent"); d.ui.toast = "Nudge email sent"; })}>Send booking nudge</Btn>
          </div>
        </Card>
      );
    case "booked": {
      if (!r) return null;
      const past = s.now > r.start + 10 * MIN;
      return (
        <Card title={`Round ${r.n} booked`} sub={`${fmt.dt(r.start)} with ${r.iv}`}>
          <div className="row">
            <Btn kind="secondary" onClick={() => update((d) => interviewerBail(d))}>Interviewer unavailable → re-offer slots</Btn>
            {past && <Btn kind="danger" onClick={() => update((d) => markNoShow(d, by))}>Mark no-show</Btn>}
          </div>
          {s.now > r.start + INTERVIEW_MIN * MIN && <Notice tone="amber" title="Waiting on interviewer feedback">Completed is gated on feedback submit in the interviewer portal.</Notice>}
        </Card>
      );
    }
    case "no_show":
      return (
        <Card title="Lead is stuck — no-show" sub="No fee for now. Reopen booking so the lead can pick a new slot." className="tint">
          <div className="row"><Btn onClick={() => update((d) => reopenBooking(d))}>Reopen booking</Btn></div>
        </Card>
      );
    case "round_done":
      return (
        <Card title="Round manager" sub={`${done} round${done > 1 ? "s" : ""} complete · cap ${MAX_ROUNDS}`}>
          {L.round >= MAX_ROUNDS && <Notice tone="amber" title="Round cap reached">Hard cap of 4 rounds — send to final verdict.</Notice>}
          <div className="row">
            <Btn kind="secondary" disabled={L.round >= MAX_ROUNDS} onClick={() => update((d) => nextRound(d))}>{L.round >= MAX_ROUNDS ? "No more rounds (cap 4)" : `Schedule Round ${L.round + 1}`}</Btn>
            <Btn onClick={() => update((d) => toFinal(d))}>Send to final verdict</Btn>
          </div>
        </Card>
      );
    case "decision_pending": {
      const esc = s.offer.escalation === "pending";
      const enough = done >= MIN_ROUNDS_FOR_OFFER;
      return (
        <Card title="Decision" sub="Final verdict — Adhiraj, with Vidit on escalation. Team can advocate borderline profiles on intent.">
          {esc && <Notice tone="amber" title="Escalated to Vidit">{s.role === "vidit" ? "Override to proceed with the offer, or uphold." : "Waiting on Vidit."}</Notice>}
          {!enough && <Notice tone="gray" title={`Only ${done} completed round${done === 1 ? "" : "s"}`}>“Approved for offer” needs at least {MIN_ROUNDS_FOR_OFFER}. Schedule another round first.</Notice>}
          {s.cfg.lateCohort && <Notice tone="blue" title="Late in cohort">Reject is disabled — waitlist instead (policy).</Notice>}
          {esc && s.role === "vidit" ? (
            <div className="row">
              <Btn disabled={!enough} onClick={() => update((d) => approve(d, "Vidit"))}>Override → Approved for offer</Btn>
              <Btn kind="secondary" onClick={() => update((d) => uphold(d, "waitlist"))}>Uphold → Waitlist</Btn>
              <Btn kind="danger" disabled={s.cfg.lateCohort} onClick={() => update((d) => uphold(d, "reject"))}>Uphold → Reject</Btn>
            </div>
          ) : (
            <div className="row">
              <Btn disabled={!canReserve || !enough} title={!canReserve ? "Reserved: Adhiraj / Vidit only" : ""} onClick={() => update((d) => approve(d, d.role === "vidit" ? "Vidit" : "Adhiraj"))}>
                Add activity: Approved for offer
              </Btn>
              <Btn kind="secondary" onClick={() => update((d) => waitlist(d, by))}>Waitlist</Btn>
              <Btn kind="danger" disabled={s.cfg.lateCohort} onClick={() => update((d) => reject(d, by))}>Reject</Btn>
              {!esc && s.role !== "vidit" && <Btn kind="ghost" onClick={() => update((d) => escalate(d, by))}>Escalate to Vidit</Btn>}
              {L.round < MAX_ROUNDS && <Btn kind="ghost" onClick={() => update((d) => nextRound(d))}>Another round</Btn>}
            </div>
          )}
          {!canReserve && !esc && <span className="small muted">You’re acting as a counsellor — approval buttons are locked. Switch role in the header.</span>}
        </Card>
      );
    }
    case "waitlisted":
      return (
        <Card title="Waitlisted" sub="Reviewed each round. Bring back for a decision when the profile strengthens." className="tint">
          <div className="row">
            <Btn kind="secondary" onClick={() => update((d) => { d.lead.stage = "decision_pending"; act(d, by, "Waitlist review → back to decision"); })}>Re-review now</Btn>
            {L.round < MAX_ROUNDS && <Btn kind="ghost" onClick={() => update((d) => nextRound(d))}>Invite to another round</Btn>}
          </div>
        </Card>
      );
    case "rejected":
      return (
        <Card title="Rejected" sub={`Reject comms sent. Can reapply after ${fmt.longDate((L.rejectedAt ?? s.now) + COOLDOWN_DAYS * DAY)} at full application fee.`} />
      );
    case "approved":
      return (
        <Card title={`Approved for offer by ${s.offer.approvedBy}`} sub={`Offer status: ${s.offer.status}`} className="tint">
          <div className="row">
            <Btn onClick={() => update((d) => (d.ui.adTab = s.offer.status === "scholarship" ? "scholarship" : s.offer.status === "letters" ? "letters" : "tracking"))}>
              {s.offer.status === "scholarship" ? "Set scholarship →" : s.offer.status === "letters" ? "Preview & send letters →" : "Open offer tracking →"}
            </Btn>
          </div>
        </Card>
      );
  }
  return null;
}

// ---------------- Booking control ----------------
function Booking() {
  const { s, update } = useStore();
  const w = bookingWindow(s);
  return (
    <>
      <Intro title="Booking control" sub="Leads only see the next N days with open slots (3-3-3). When a window fills, the next one opens." />
      <Card title="Visible days" sub="Admin-controlled; applies to every lead immediately">
        <div className="seg">
          {[2, 3, 4, 5].map((n) => (
            <button key={n} className={s.cfg.visibleDays === n ? "on" : ""} onClick={() => update((d) => (d.cfg.visibleDays = n))}>{n} days</button>
          ))}
        </div>
      </Card>
      <div className="grid4">
        <div className="stat"><div className="k">Current window</div><div className="v" style={{ fontSize: 16 }}>{w.none ? "No supply" : `${w.days[0]} – ${w.days[w.days.length - 1]}`}</div></div>
        <div className="stat"><div className="k">Open slots</div><div className="v">{w.free}</div><div className="d">of {w.total}</div></div>
        <div className="stat"><div className="k">Windows exhausted</div><div className="v">{w.exhaustedChunks}</div></div>
        <div className="stat"><div className="k">Non-bookers</div><div className="v">{COHORT.filter((x) => x.stage === "shortlisted").length + (s.lead.stage === "shortlisted" ? 1 : 0)}</div><div className="d">threshold for a deadline: TBD</div></div>
      </div>
      <Card title="Demo controls">
        <div className="row">
          <Btn kind="secondary" onClick={() => update((d) => { bookingWindow(d).slots.forEach((x) => (x.taken = true)); d.ui.toast = "Current window filled — next window opens for leads"; })}>Fill current window</Btn>
          <Btn kind="secondary" onClick={() => update((d) => { d.slots.forEach((x) => { if (!d.lead.rounds.some((r) => r.slotId === x.id)) x.taken = true; }); })}>Remove all supply</Btn>
          <Btn kind="ghost" onClick={() => update((d) => { d.slots.forEach((x) => { if (!d.lead.rounds.some((r) => r.slotId === x.id && r.status === "booked")) x.taken = false; }); })}>Free all slots</Btn>
        </div>
      </Card>
    </>
  );
}

// ---------------- Scholarship ----------------
function Scholarship() {
  const { s, update } = useStore();
  const sc = scholarship(s);
  const O = s.offer;
  const by = who(s);
  if (O.status === "none")
    return (
      <>
        <Intro title="Scholarship module" sub="Opens once the lead has the “Approved for offer” activity." />
        <IllusCard name="certificate" title="Not approved for offer yet" sub={`Current stage: ${s.lead.stage.replace("_", " ")}. The rubric unlocks once Adhiraj or Vidit adds “Approved for offer”.`} />
      </>
    );
  return (
    <>
      <Intro title="Scholarship module" sub="Rubric is advisory — a human decides. Counsellor holds ±5%; beyond that needs Vidit’s logged approval." status={O.pct !== null ? `Current: ${O.pct}%` : "Not set"} tone="gray" />
      <div className="split">
        <Card title="Rubric · 5 metrics × 0–2" sub="Metric names are illustrative">
          {RUBRIC.map((m, i) => (
            <div key={m} className="row between">
              <span style={{ fontSize: 13 }}>{m}</span>
              <div className="seg">
                {[0, 1, 2].map((n) => (
                  <button key={n} className={O.rubric[i] === n ? "on" : ""} onClick={() => update((d) => { d.offer.rubric[i] = n; d.offer.final = null; d.offer.exception = "none"; })}>{n}</button>
                ))}
              </div>
            </div>
          ))}
          <KV rows={[["Score", `${sc.score} / 10`], ["Tier", sc.tier], ["Recommended", `${sc.rec}%`]]} />
          <span className="small muted">Tiers: {TIERS.map((t) => `${t.tier} ≥${t.min} → ${t.pct}%`).join(" · ")}</span>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card title="Final scholarship">
            <div className="row">
              <Btn kind="secondary" sm onClick={() => update((d) => { d.offer.final = Math.max(0, sc.final - 1); if (d.offer.exception === "approved") d.offer.exception = "none"; })}>−</Btn>
              <b style={{ fontSize: 28, minWidth: 70, textAlign: "center" }}>{sc.final}%</b>
              <Btn kind="secondary" sm onClick={() => update((d) => { d.offer.final = Math.min(60, sc.final + 1); if (d.offer.exception === "approved") d.offer.exception = "none"; })}>+</Btn>
            </div>
            <span className="small muted">Δ vs recommended: {sc.delta > 0 ? "+" : ""}{sc.delta}%</span>
            {sc.needsVidit ? (
              O.exception === "approved" ? (
                <Notice tone="green" title="Vidit approved this exception">Logged on CRM.</Notice>
              ) : s.role === "vidit" ? (
                <Btn onClick={() => update((d) => { d.offer.exception = "approved"; act(d, "Vidit", `Scholarship exception approved: ${sc.final}% (rec ${sc.rec}%)`, true); })}>Approve exception (Vidit)</Btn>
              ) : (
                <>
                  <Notice tone="amber" title="Beyond ±5% — needs Vidit">{O.exception === "pending" ? "Request sent. Waiting on Vidit." : "Request approval to proceed."}</Notice>
                  {O.exception !== "pending" && <Btn kind="secondary" onClick={() => update((d) => { d.offer.exception = "pending"; act(d, by, `Requested Vidit approval for ${sc.final}% (rec ${sc.rec}%)`); })}>Request Vidit approval</Btn>}
                </>
              )
            ) : (
              <Notice tone="green" title="Within counsellor guardrail (±5%)">No approval needed.</Notice>
            )}
          </Card>
          <Card title="Fee impact" sub="Deducts proportionally from tuition — never the admission fee">
            <KV rows={[["Admission fee", fmt.money(FEES.admission)], ["Term 1 tuition", fmt.money(sc.term1)], ["Term 2 tuition", fmt.money(sc.term2)], ["Scholarship amount", `−${fmt.money(sc.amt)}`], ["Total", fmt.money(sc.total), "tot"]]} />
          </Card>
          <Btn disabled={sc.needsVidit && O.exception !== "approved"} onClick={() => update((d) => { saveScholarship(d, by); if (d.offer.status === "letters") d.ui.adTab = "letters"; })}>
            {O.status === "live" || O.status === "expired" ? "Save & send revised offer" : "Save & generate letters"}
          </Btn>
        </div>
      </div>
    </>
  );
}

// ---------------- Letters ----------------
function Letters() {
  const { s, update } = useStore();
  const O = s.offer;
  const sc = scholarship({ ...s, offer: { ...O, final: O.pct } });
  if (O.status === "none" || O.status === "scholarship")
    return (
      <>
        <Intro title="Letters & send" sub="Letters generate from fixed templates once the scholarship is saved." />
        <IllusCard name="certificate" title="Nothing to preview yet" sub={O.status === "scholarship" ? "Save the scholarship first — letters generate from it." : "Lead isn’t approved for offer."} />
      </>
    );
  const sent = O.status !== "letters";
  const checks = ["Name, programme and cohort are correct", `Scholarship (${O.pct}%) and payment schedule match the module`, `Deadline is ${s.cfg.deadlineDays} days from send`];
  return (
    <>
      <Intro title="Letters & send" sub="Fixed templates, variables only. Sent from the official SSB ID; email and dashboard update at the same moment." status={sent ? `Sent · v${O.version}` : "Draft"} tone={sent ? "green" : "amber"} />
      <div className="grid2">
        <div className="letter">
          <span className="small muted">Provisional admission letter · template v3</span>
          <h4>Scaler School of Business — Provisional Admission</h4>
          <p>Dear {s.lead.name},</p>
          <p>We are pleased to offer you provisional admission to the SSB PGP 2027 cohort, subject to payment of the admission fee by the deadline.</p>
          <KV rows={[["Admission fee (due on acceptance)", fmt.money(FEES.admission)], ["Term 1 tuition", fmt.money(sc.term1)], ["Term 2 tuition", fmt.money(sc.term2)], ["Total", fmt.money(sc.total), "tot"]]} />
          <p className="small muted">Full payment schedule included for bank / education-loan use.</p>
        </div>
        {(O.pct ?? 0) > 0 ? (
          <div className="letter">
            <span className="small muted">Scholarship letter · pure template</span>
            <h4>Merit scholarship — {O.pct}%</h4>
            <p>Dear {s.lead.name},</p>
            <p>You have been awarded a {O.pct}% merit scholarship ({fmt.money(sc.amt)}), applied proportionally to Term 1 and Term 2 tuition. The admission fee is unchanged.</p>
          </div>
        ) : (
          <div className="letter"><span className="small muted">No scholarship letter — lead isn’t a scholarship holder.</span></div>
        )}
      </div>
      {!sent ? (
        <Card title="Preview / audit (mandatory)" sub="From: SSB Admissions — official SSB ID">
          {checks.map((c, i) => (
            <label key={i} className="check"><input type="checkbox" checked={O.audit[i]} onChange={(e) => update((d) => (d.offer.audit[i] = e.target.checked))} /> {c}</label>
          ))}
          <div className="row"><Btn disabled={O.audit.some((x) => !x)} onClick={() => update((d) => { sendOffer(d, who(d)); d.ui.adTab = "tracking"; })}>Send offer (email + dashboard)</Btn></div>
        </Card>
      ) : (
        <Notice tone="green" title="Offer sent">Email and dashboard updated together. Manage it in Offer tracking.</Notice>
      )}
    </>
  );
}

// ---------------- Offer tracking ----------------
function Tracking() {
  const { s, update } = useStore();
  const O = s.offer;
  const by = who(s);
  const [days, setDays] = useState(3);
  const order = ["Approval pending", "Approved", "Scholarship set", "Letters live", "Active", "Expired", "Accepted", "Onboarding"];
  const cur = O.status === "none" ? 0 : O.status === "scholarship" ? 1 : O.status === "letters" ? 2 : O.status === "live" ? 4 : O.status === "expired" ? 5 : O.onboarding?.submitted ? 7 : 6;
  return (
    <>
      <Intro title="Offer tracking" sub="Offer states live on the CRM record — no O2A sheet. No auto-waitlist on expiry." />
      <div className="states">
        {order.map((x, i) => (
          <span key={x} className="row" style={{ gap: 6 }}>
            <Tag tone={i === cur ? (x === "Expired" ? "red" : "dark") : i < cur ? "green" : "gray"}>{x}</Tag>
            {i < order.length - 1 && <span className="arr">→</span>}
          </span>
        ))}
      </div>
      {O.status === "live" || O.status === "expired" ? (
        <div className="grid2">
          <Card title={O.status === "expired" ? "Offer expired" : "Offer live"} sub={`v${O.version} · deadline ${fmt.dt(O.deadline!)}`} className={O.status === "expired" ? "" : "tint"}>
            {O.status === "live" ? <b style={{ fontSize: 26 }}>{fmt.dur(O.deadline! - s.now)} left</b> : (
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <img src="/illus/broken-link.png" alt="" width={96} height={96} />
                <Notice tone="red" title="Deadline passed">Counsellor action needed. Lead was not moved to waitlist.</Notice>
              </div>
            )}
            <div className="row">
              <Field label="Extend by (days)"><input type="number" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ width: 90 }} /></Field>
              <div style={{ alignSelf: "flex-end" }}><Btn onClick={() => update((d) => extendOffer(d, by, days))}>Extend expiry</Btn></div>
            </div>
            <div className="row">
              <Btn kind="secondary" onClick={() => update((d) => resendOffer(d, by))}>Resend offer</Btn>
              <Btn kind="secondary" onClick={() => update((d) => (d.ui.adTab = "scholarship"))}>Change scholarship</Btn>
            </div>
          </Card>
          <Card title="Payments" sub="PhonePe primary · Razorpay backup">
            {O.payments.length === 0 && <span className="small muted">No attempts yet.</span>}
            {O.payments.map((p, i) => (
              <div key={i} className="row between small"><span>{fmt.dt(p.at)} · {p.gw}</span>{p.ok ? <Tag>Success</Tag> : <Tag tone="red">Failed</Tag>}</div>
            ))}
          </Card>
        </div>
      ) : O.status === "accepted" ? (
        <Card title="Accepted — admission fee paid" sub="Auto-marked on reconciliation · loan + term-1 checklist triggered" className="tint">
          <KV rows={[["Paid via", O.payments.filter((p) => p.ok).map((p) => p.gw).join(", ")], ["Onboarding form", O.onboarding?.submitted ? `Submitted ${fmt.dt(O.onboarding.at)}` : "Pending"]]} />
        </Card>
      ) : (
        <IllusCard name="certificate" title="No live offer yet" sub={`Offer status: ${O.status}. Approve, set the scholarship and send letters to start the clock.`} />
      )}
      <Card title="Revision history">
        {O.revisions.length === 0 && <span className="small muted">Nothing yet.</span>}
        <div className="timeline">
          {O.revisions.map((r, i) => (
            <div className="tl-item" key={i}><span className="when">{fmt.dt(r.at)}</span><span><b>{r.kind}</b> · v{r.version} · {r.note}</span></div>
          ))}
        </div>
      </Card>
    </>
  );
}

// ---------------- Settings ----------------
function Settings() {
  const { s, update } = useStore();
  return (
    <>
      <Intro title="Settings" sub="Cohort-level policy switches and demo toggles." />
      <Card title="Offer deadline (default)" sub="Counsellor-settable timer · reflected on dashboard and offer email">
        <div className="seg">
          {[3, 5, 7, 10, 14].map((n) => (
            <button key={n} className={s.cfg.deadlineDays === n ? "on" : ""} onClick={() => update((d) => (d.cfg.deadlineDays = n))}>{n} days</button>
          ))}
        </div>
      </Card>
      <Card title="Late in cohort" sub="When on, Reject is disabled — borderline and weak profiles go to waitlist instead.">
        <label className="check"><input type="checkbox" checked={s.cfg.lateCohort} onChange={(e) => update((d) => (d.cfg.lateCohort = e.target.checked))} /> Late-cohort safeguard</label>
      </Card>
      <Card title="Simulate PhonePe outage" sub="Payment attempts on PhonePe fail and the lead is offered Razorpay.">
        <label className="check"><input type="checkbox" checked={s.cfg.phonepeDown} onChange={(e) => update((d) => (d.cfg.phonepeDown = e.target.checked))} /> PhonePe down</label>
      </Card>
    </>
  );
}
