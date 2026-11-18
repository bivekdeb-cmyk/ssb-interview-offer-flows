"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  currentRound, fmt, FEEDBACK_QS, INTERVIEW_MIN, MIN, DAY, HOUR, markNoShow, submitFeedback, PAYOUT_PER_INTERVIEW, dayKey, State, UI,
} from "@/lib/model";
import { Btn, Card, Field, IllusCard, Intro, KV, Notice, Tag } from "@/components/ui";
import { CalendarDots, IdentificationCard, NotePencil, VideoCamera, Wallet } from "@phosphor-icons/react";
import { WorkShell } from "@/components/work";
import { IMG } from "@/lib/images";

function me(s: State) {
  const r = currentRound(s) ?? s.lead.rounds[s.lead.rounds.length - 1];
  return r?.iv ?? "Karan Shah";
}

export default function InterviewerPage() {
  const { s, update } = useStore();
  const r = currentRound(s);
  const pending = r && s.now > r.start + INTERVIEW_MIN * MIN ? 1 : 0;
  const tab = s.iv.onboarded ? s.ui.ivTab : "onboarding";
  return (
    <WorkShell
      anno={`Interviewer platform · ${({ onboarding: "Onboarding + contract", slots: "My slots", interviews: "Interviews", feedback: "Feedback", payouts: "Payouts" } as Record<string, string>)[tab]}`}
      note="Scaler Academy Mentor-dashboard reuse · no WhatsApp / Typeform"
      user={me(s)}
      avatar={IMG.interviewer}
      label="INTERVIEWER PORTAL"
      nav={[
        { id: "onboarding", label: "Onboarding", icon: <IdentificationCard size={18} />, count: s.iv.onboarded ? "Done" : "!" },
        { id: "slots", label: "My slots", icon: <CalendarDots size={18} /> },
        { id: "interviews", label: "Interviews", icon: <VideoCamera size={18} /> },
        { id: "feedback", label: "Feedback due", icon: <NotePencil size={18} />, count: pending },
        { id: "payouts", label: "Payouts", icon: <Wallet size={18} /> },
      ]}
      active={tab}
      onNav={(id) => update((d) => (d.ui.ivTab = id as UI["ivTab"]))}
      footer="SSB Interviewer portal · contractor"
    >
      {tab === "onboarding" && <Onboarding />}
      {tab === "slots" && <Slots />}
      {tab === "interviews" && <Interviews />}
      {tab === "feedback" && <FeedbackForm />}
      {tab === "payouts" && <Payouts />}
    </WorkShell>
  );
}

function Onboarding() {
  const { s, update } = useStore();
  const [agree, setAgree] = useState(false);
  return (
    <>
      <Intro title="Welcome to the SSB interviewer panel" sub="You’re joining as a contractor. Complete onboarding to start adding interview slots." status={s.iv.onboarded ? "Active" : "Onboarding"} tone={s.iv.onboarded ? "green" : "amber"} />
      <div className="grid3">
        <Card title="1 · Profile" sub="Name, LinkedIn, domain expertise"><Tag>Done</Tag></Card>
        <Card title="2 · Interviewer training" sub="Rubric walkthrough + 2 shadow interviews"><Tag>Done</Tag></Card>
        <Card title="3 · Contract" sub="Contractor agreement">{s.iv.contractSigned ? <Tag>Signed</Tag> : <Tag tone="amber">Pending</Tag>}</Card>
      </div>
      {!s.iv.contractSigned ? (
        <Card title="Contractor agreement" sub="Read and sign to activate your account" right={<img src="/illus/certificate.png" alt="" width={110} height={110} />}>
          <KV rows={[["Engagement", "Independent contractor"], ["Payout", `${fmt.money(PAYOUT_PER_INTERVIEW)} per completed interview`], ["Completed means", "Interview held + feedback submitted in portal"], ["No-shows / cancellations", "Not paid"], ["Payment cycle", "Monthly report to finance (manual)"]]} />
          <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I’ve read the agreement and accept the terms.</label>
          <div className="row"><Btn disabled={!agree} onClick={() => update((d) => { d.iv.contractSigned = true; d.iv.onboarded = true; d.ui.ivTab = "slots"; d.ui.toast = "Contract signed — you can now add slots."; })}>Sign &amp; activate</Btn></div>
        </Card>
      ) : (
        <Notice tone="green" title="You’re active">Add slots under “My slots”. Leads only see the next few days of supply, so keep your calendar fresh.</Notice>
      )}
    </>
  );
}

function Slots() {
  const { s, update } = useStore();
  const name = me(s);
  const mine = s.slots.filter((x) => x.iv === name && x.start > s.now && x.start < s.now + 9 * DAY);
  const days = [...new Set(mine.map((x) => dayKey(x.start)))];
  const [day, setDay] = useState(days[0] ?? "");
  const [hour, setHour] = useState("14");
  const addSlot = () =>
    update((d) => {
      const base = d.slots.find((x) => dayKey(x.start) === day);
      if (!base) return;
      const midnight = base.start - ((base.start + 5.5 * HOUR) % DAY);
      const start = midnight + Number(hour) * HOUR;
      if (d.slots.some((x) => x.start === start && x.iv === name && !x.removed)) { d.ui.toast = "You already have that slot."; return; }
      const existing = d.slots.find((x) => x.start === start && x.iv === name && x.removed);
      if (existing) existing.removed = false;
      else d.slots.push({ id: `iv-${start}`, start, iv: name, taken: false, removed: false });
      d.slots.sort((a, b) => a.start - b.start);
      d.ui.toast = `Slot added · ${fmt.dt(start)}`;
    });
  return (
    <>
      <Intro title="My slots" sub="Self-serve: add or remove your availability. 30-min interview + 15-min buffer per slot. Booked slots can’t be removed — ask admissions to reassign." />
      <Card title="Add a slot">
        <div className="row">
          <Field label="Day"><select value={day} onChange={(e) => setDay(e.target.value)}>{days.map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="Start time"><select value={hour} onChange={(e) => setHour(e.target.value)}>{[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((h) => <option key={h} value={h}>{h > 12 ? h - 12 : h}:00 {h >= 12 ? "PM" : "AM"}</option>)}</select></Field>
          <div style={{ alignSelf: "flex-end" }}><Btn onClick={addSlot}>Add slot</Btn></div>
        </div>
      </Card>
      <div className="grid3">
        {days.map((dk) => (
          <div className="daycol" key={dk}>
            <h4>{dk}</h4>
            {mine.filter((x) => dayKey(x.start) === dk).map((x) => {
              const isLead = s.lead.rounds.some((r) => r.slotId === x.id && r.status === "booked");
              return (
                <div key={x.id} className="slot" style={x.removed ? { opacity: 0.5 } : isLead ? { borderColor: "var(--g)", background: "var(--tint)" } : {}}>
                  <span>{fmt.time(x.start)} {isLead ? `· ${s.lead.first}` : x.taken ? "· booked" : x.removed ? "· removed" : "· open"}</span>
                  {x.taken ? <Tag tone={isLead ? "green" : "gray"}>Booked</Tag> : (
                    <button className="btn ghost sm" onClick={() => update((d) => { const t = d.slots.find((y) => y.id === x.id)!; t.removed = !t.removed; })}>{x.removed ? "Restore" : "Remove"}</button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

const MOCK_DONE = [
  ["Rohit Shah", "R1", "Yes"], ["Isha Iyer", "R2", "Yes"], ["Kabir Kapoor", "R1", "No"], ["Neha Nair", "R1", "Yes"], ["Dev Reddy", "R1", "Yes"],
];

function Interviews() {
  const { s, update } = useStore();
  const [t, setT] = useState<"upcoming" | "completed" | "missed">("upcoming");
  const name = me(s);
  const r = currentRound(s);
  const myRounds = s.lead.rounds.filter((x) => x.iv === name);
  const done = myRounds.filter((x) => x.status === "completed");
  const missed = myRounds.filter((x) => x.status === "no_show");
  return (
    <>
      <Intro title="Interviews" sub="Upcoming, completed and missed. “Completed” only counts once feedback is submitted." />
      <div className="tabs">
        <button className={t === "upcoming" ? "on" : ""} onClick={() => setT("upcoming")}>Upcoming ({r && r.iv === name ? 1 : 0} + 3)</button>
        <button className={t === "completed" ? "on" : ""} onClick={() => setT("completed")}>Completed ({s.iv.completedBefore + done.length})</button>
        <button className={t === "missed" ? "on" : ""} onClick={() => setT("missed")}>Missed ({s.iv.missedBefore + missed.length})</button>
      </div>
      {t === "upcoming" && (
        <table className="tbl">
          <thead><tr><th>Lead</th><th>Round</th><th>When</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {r && r.iv === name && (() => {
              const past = s.now > r.start + INTERVIEW_MIN * MIN;
              const live = s.now >= r.start - 10 * MIN && !past;
              return (
                <tr>
                  <td><b>{s.lead.name}</b><div className="small muted">{s.lead.ve}</div></td>
                  <td>R{r.n}</td>
                  <td>{fmt.dt(r.start)}</td>
                  <td>{past ? <Tag tone="amber">Feedback due</Tag> : live ? <Tag>Live</Tag> : <Tag tone="gray">Scheduled</Tag>}</td>
                  <td>
                    <div className="row">
                      {!past && <Btn sm kind="secondary" disabled={!live} onClick={() => update((d) => (d.ui.modal = { title: "Joining Google Meet", body: [r.meet, "Auto-recording on · transcript + summary go to CRM."] }))}>Join</Btn>}
                      {past && <Btn sm onClick={() => update((d) => (d.ui.ivTab = "feedback"))}>Submit feedback</Btn>}
                      {s.now > r.start + 10 * MIN && <Btn sm kind="danger" onClick={() => update((d) => markNoShow(d))}>Mark no-show</Btn>}
                    </div>
                  </td>
                </tr>
              );
            })()}
            {[["Tara Joshi", "R1", 2], ["Vikram Menon", "R2", 3], ["Meher Verma", "R1", 4]].map(([n, rr, dd]) => (
              <tr key={n as string}><td><b>{n}</b></td><td>{rr}</td><td>{fmt.dt(s.now + (dd as number) * DAY + 2 * HOUR)}</td><td><Tag tone="gray">Scheduled</Tag></td><td /></tr>
            ))}
          </tbody>
        </table>
      )}
      {t === "completed" && (
        <table className="tbl">
          <thead><tr><th>Lead</th><th>Round</th><th>Verdict</th><th>Payout</th></tr></thead>
          <tbody>
            {done.map((x) => (
              <tr key={x.n}><td><b>{s.lead.name}</b></td><td>R{x.n}</td><td>{x.feedback?.verdict === "yes" ? <Tag>Yes</Tag> : <Tag tone="red">No</Tag>}</td><td>{fmt.money(PAYOUT_PER_INTERVIEW)}</td></tr>
            ))}
            {MOCK_DONE.map(([n, rr, v]) => (
              <tr key={n}><td><b>{n}</b></td><td>{rr}</td><td>{v === "Yes" ? <Tag>Yes</Tag> : <Tag tone="red">No</Tag>}</td><td>{fmt.money(PAYOUT_PER_INTERVIEW)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      {t === "missed" && (
        <table className="tbl">
          <thead><tr><th>Lead</th><th>Round</th><th>When</th><th>Next step</th></tr></thead>
          <tbody>
            {missed.map((x) => (
              <tr key={x.n}><td><b>{s.lead.name}</b></td><td>R{x.n}</td><td>{fmt.dt(x.start)}</td><td>Counsellor reopens booking · not paid</td></tr>
            ))}
            <tr><td><b>Kunal Bose</b></td><td>R1</td><td>{fmt.dt(s.now - 3 * DAY)}</td><td>Rebooked by counsellor</td></tr>
          </tbody>
        </table>
      )}
    </>
  );
}

function FeedbackForm() {
  const { s, update } = useStore();
  const r = currentRound(s);
  const [scores, setScores] = useState<number[]>(FEEDBACK_QS.map(() => 0));
  const [notes, setNotes] = useState<string[]>(FEEDBACK_QS.map(() => ""));
  const [verdict, setVerdict] = useState<"" | "yes" | "no">("");
  const [remark, setRemark] = useState("");
  const [tried, setTried] = useState(false);
  if (!r || s.now < r.start + INTERVIEW_MIN * MIN)
    return (
      <>
        <Intro title="Feedback" sub="Per-question scores and a yes/no verdict, straight to CRM. No Google Form." />
        <IllusCard name="clock" title="No feedback due right now" sub={r ? `${s.lead.name}’s R${r.n} interview ends at ${fmt.time(r.start + INTERVIEW_MIN * MIN)} — the form unlocks after.` : "Feedback forms appear here after each interview."} />
      </>
    );
  const missingScores = scores.some((x) => !x);
  const submit = () => {
    setTried(true);
    if (missingScores || !verdict) return;
    update((d) => submitFeedback(d, { scores, notes, verdict, remark }));
  };
  return (
    <>
      <Intro title={`Feedback · ${s.lead.name} · Round ${r.n}`} sub={`Interview on ${fmt.dt(r.start)}. Submitting marks the interview Completed and pushes to CRM.`} status="Feedback due" tone="amber" />
      <Card title="Recording" sub="Auto-recorded on Google Meet">
        <KV rows={[["Transcript", "Ready"], ["AI summary", "Ready · visible on CRM lead card"]]} />
      </Card>
      <Card title="Per-question scores" sub="1 = weak · 5 = exceptional">
        {FEEDBACK_QS.map((q, i) => (
          <div key={q} style={{ display: "grid", gridTemplateColumns: "220px auto 1fr", gap: 14, alignItems: "center" }}>
            <b style={{ fontSize: 13, color: tried && !scores[i] ? "var(--red)" : undefined }}>{q}</b>
            <div className="seg">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={scores[i] === n ? "on" : ""} onClick={() => setScores(scores.map((x, j) => (j === i ? n : x)))}>{n}</button>
              ))}
            </div>
            <input className="search" placeholder="Notes (optional)" value={notes[i]} onChange={(e) => setNotes(notes.map((x, j) => (j === i ? e.target.value : x)))} />
          </div>
        ))}
        {tried && missingScores && <span className="small" style={{ color: "var(--red)" }}>Score every question.</span>}
      </Card>
      <Card title="Verdict">
        <div className="seg">
          <button className={verdict === "yes" ? "on" : ""} onClick={() => setVerdict("yes")}>Yes — move forward</button>
          <button className={verdict === "no" ? "on" : ""} onClick={() => setVerdict("no")}>No</button>
        </div>
        {tried && !verdict && <span className="small" style={{ color: "var(--red)" }}>A yes/no verdict is required.</span>}
        <Field label="Overall remark"><textarea rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} /></Field>
        <div className="row"><Btn onClick={submit}>Submit feedback</Btn></div>
      </Card>
    </>
  );
}

function Payouts() {
  const { s } = useStore();
  const name = me(s);
  const live = s.lead.rounds.filter((x) => x.iv === name && x.status === "completed").length;
  const completed = s.iv.completedBefore + live;
  const missed = s.iv.missedBefore + s.lead.rounds.filter((x) => x.iv === name && x.status === "no_show").length;
  return (
    <>
      <Intro title="Payouts" sub="₹700 per completed interview. Report goes to finance monthly — payouts aren’t automated." />
      <div className="grid4">
        <div className="stat"><div className="k">Completed (Nov)</div><div className="v">{completed}</div></div>
        <div className="stat"><div className="k">Missed / no-show</div><div className="v">{missed}</div><div className="d">Not paid</div></div>
        <div className="stat"><div className="k">Rate</div><div className="v">{fmt.money(PAYOUT_PER_INTERVIEW)}</div></div>
        <div className="stat"><div className="k">November payout</div><div className="v">{fmt.money(completed * PAYOUT_PER_INTERVIEW)}</div></div>
      </div>
      <table className="tbl">
        <thead><tr><th>Month</th><th>Completed</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>November 2026</td><td>{completed}</td><td>{fmt.money(completed * PAYOUT_PER_INTERVIEW)}</td><td><Tag tone="amber">Report due 1 Dec</Tag></td></tr>
          <tr><td>October 2026</td><td>22</td><td>{fmt.money(22 * PAYOUT_PER_INTERVIEW)}</td><td><Tag>Paid by finance</Tag></td></tr>
          <tr><td>September 2026</td><td>17</td><td>{fmt.money(17 * PAYOUT_PER_INTERVIEW)}</td><td><Tag>Paid by finance</Tag></td></tr>
        </tbody>
      </table>
    </>
  );
}
