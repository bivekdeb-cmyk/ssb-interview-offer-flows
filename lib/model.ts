// Domain model for the SSB C4 Interview & Offer flow prototype.
// Source of truth: "SSB - Interview & Offer Flow + Dashboard Build Scope (v2)".
// Everything here is pure: actions take a draft State and mutate it.

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
export const MIN = 60_000;
export const START_NOW = Date.parse("2026-11-18T10:00:00+05:30");
export const INTERVIEW_MIN = 30; // 30-min interview
export const BUFFER_MIN = 15; // + 15-min buffer
export const RESCHEDULE_CUTOFF_H = 24;
export const MAX_ROUNDS = 4;
export const MIN_ROUNDS_FOR_OFFER = 2;
export const PAYOUT_PER_INTERVIEW = 700;
export const COOLDOWN_DAYS = 30;

// Illustrative fee numbers (not in the scope doc) — admission fee is the same for everyone.
export const FEES = { admission: 75_000, term1: 9_50_000, term2: 9_50_000 };

export const RUBRIC = [
  "Academic & test record",
  "Work experience quality",
  "Interview performance",
  "Intent & clarity of goals",
  "Leadership & initiative",
];
// Illustrative tier table: score /10 → tier → recommended %
export const TIERS = [
  { min: 9, tier: "Tier A", pct: 30 },
  { min: 7, tier: "Tier B", pct: 20 },
  { min: 5, tier: "Tier C", pct: 10 },
  { min: 0, tier: "Tier D", pct: 0 },
];
export const FEEDBACK_QS = [
  "Problem structuring",
  "Business & numbers sense",
  "Communication",
  "Intent & motivation",
  "Coachability",
];
export const INTERVIEWERS = ["Karan Shah", "Meera Iyer", "Rohan Das"];
export const RESCHEDULE_REASONS = ["Work conflict", "Health", "Travel", "Family / personal", "Exam or other commitment", "Other"];

export type Stage =
  | "shortlisted"
  | "booked"
  | "round_done"
  | "no_show"
  | "decision_pending"
  | "waitlisted"
  | "rejected"
  | "approved";

export type Slot = { id: string; start: number; iv: string; taken: boolean; removed: boolean };
export type Feedback = { scores: number[]; notes: string[]; verdict: "yes" | "no"; remark: string };
export type Round = {
  n: number;
  slotId: string;
  iv: string;
  start: number;
  meet: string;
  status: "booked" | "completed" | "no_show" | "cancelled";
  feedback?: Feedback;
  summary?: string;
};
export type Email = { id: string; at: number; subject: string; lines: string[]; cta?: string; tag?: string };
export type Activity = { at: number; who: string; text: string; reserved?: boolean };
export type Revision = { at: number; kind: string; note: string; version: number };
export type Payment = { at: number; gw: "PhonePe" | "Razorpay"; ok: boolean };
export type Role = "counsellor" | "adhiraj" | "vidit";

export type Offer = {
  status: "none" | "scholarship" | "letters" | "live" | "expired" | "accepted";
  approvedBy?: string;
  escalation?: "pending" | "overridden" | "upheld";
  rubric: number[];
  final: number | null;
  exception: "none" | "pending" | "approved";
  pct: number | null;
  deadline: number | null;
  version: number;
  revisions: Revision[];
  audit: boolean[];
  payments: Payment[];
  extensions: number;
  onboarding?: { submitted: boolean; loan: boolean; type: "salaried" | "family"; at: number };
};

export type UI = {
  review: string | null; // slot selected for review
  resched: boolean;
  reschedSel: string | null;
  pay: null | { gw: "PhonePe" | "Razorpay"; phase: "choose" | "processing" | "failed" };
  editProfile: boolean;
  leadTab: "dashboard" | "inbox";
  ivTab: "onboarding" | "slots" | "interviews" | "feedback" | "payouts";
  adTab: "pipeline" | "lead" | "booking" | "scholarship" | "letters" | "tracking" | "settings";
  feedbackFor: number | null;
  onboardingLoan: boolean;
  onboardingType: "salaried" | "family";
  modal: null | { title: string; body: string[] };
  toast: string | null;
};

export type State = {
  v: number;
  now: number;
  role: Role;
  cfg: { visibleDays: number; lateCohort: boolean; phonepeDown: boolean; deadlineDays: number };
  slots: Slot[];
  lead: {
    name: string;
    first: string;
    id: string;
    counsellor: { name: string; phone: string };
    ctc: string;
    linkedin: string;
    ve: string;
    stage: Stage;
    round: number; // round currently being booked / run
    rounds: Round[];
    reschedules: { at: number; reason: string; from: number; to: number }[];
    noShows: number;
    notice: null | "bail" | "reopened" | "next_round";
    rejectedAt: number | null;
    profileUpdates: { at: number; note: string }[];
    unblocks: number;
  };
  offer: Offer;
  iv: { onboarded: boolean; contractSigned: boolean; completedBefore: number; missedBefore: number };
  emails: Email[];
  activity: Activity[];
  ui: UI;
};

const SLOT_HOURS = [10, 11, 12, 15, 16, 17, 18];
const DAY0 = Date.parse("2026-11-19T00:00:00+05:30");

function genSlots(): Slot[] {
  const out: Slot[] = [];
  for (let d = 0; d < 16; d++) {
    SLOT_HOURS.forEach((h, i) => {
      const takenByOthers = d < 3 ? (d * 7 + i * 3) % 5 < 3 : (d + i) % 4 === 0;
      out.push({
        id: `d${d}-h${h}`,
        start: DAY0 + d * DAY + h * HOUR,
        iv: INTERVIEWERS[(d + i) % 3],
        taken: takenByOthers,
        removed: false,
      });
    });
  }
  return out;
}

export function initialState(): State {
  const s: State = {
    v: 3,
    now: START_NOW,
    role: "counsellor",
    cfg: { visibleDays: 3, lateCohort: false, phonepeDown: false, deadlineDays: 7 },
    slots: genSlots(),
    lead: {
      name: "Aanya Mehta",
      first: "Aanya",
      id: "SSB-27-04812",
      counsellor: { name: "Riya Kapoor", phone: "+91 98200 41235" },
      ctc: "₹14.5 LPA",
      linkedin: "linkedin.com/in/aanya-mehta",
      ve: "Product analyst · 3.5 yrs · fintech",
      stage: "shortlisted",
      round: 1,
      rounds: [],
      reschedules: [],
      noShows: 0,
      notice: null,
      rejectedAt: null,
      profileUpdates: [],
      unblocks: 0,
    },
    offer: {
      status: "none",
      rubric: [2, 1, 2, 2, 1],
      final: null,
      exception: "none",
      pct: null,
      deadline: null,
      version: 0,
      revisions: [],
      audit: [false, false, false],
      payments: [],
      extensions: 0,
    },
    iv: { onboarded: true, contractSigned: true, completedBefore: 14, missedBefore: 1 },
    emails: [],
    activity: [],
    ui: {
      review: null,
      resched: false,
      reschedSel: null,
      pay: null,
      editProfile: false,
      leadTab: "dashboard",
      ivTab: "interviews",
      adTab: "lead",
      feedbackFor: null,
      onboardingLoan: false,
      onboardingType: "salaried",
      modal: null,
      toast: null,
    },
  };
  act(s, "Counsellor", "Shortlisted for interview on CRM (Riya Kapoor)");
  email(s, "Your application status has been updated", [
    `Hi ${s.lead.first},`,
    "There’s an update on your Scaler School of Business application.",
    "Please check your dashboard for next steps.",
  ], "Check your dashboard", "Shortlist");
  return s;
}

// ---------- helpers ----------
let seq = 0;
const uid = () => `${Date.now().toString(36)}${(seq++).toString(36)}`;

export function act(s: State, who: string, text: string, reserved = false) {
  s.activity.unshift({ at: s.now, who, text, reserved });
}
export function email(s: State, subject: string, lines: string[], cta = "Open dashboard", tag?: string) {
  s.emails.unshift({ id: uid(), at: s.now, subject, lines, cta, tag });
}
export function toast(s: State, msg: string) {
  s.ui.toast = msg;
}

export const fmt = {
  date: (ms: number) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" }).format(ms),
  longDate: (ms: number) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(ms),
  time: (ms: number) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true }).format(ms).toUpperCase(),
  dt: (ms: number) => `${fmt.date(ms)}, ${fmt.time(ms)}`,
  slot: (ms: number) => `${fmt.time(ms)} – ${fmt.time(ms + INTERVIEW_MIN * MIN)} IST`,
  money: (n: number) => "₹" + Math.round(n).toLocaleString("en-IN"),
  dur: (ms: number) => {
    if (ms <= 0) return "0m";
    const d = Math.floor(ms / DAY);
    const h = Math.floor((ms % DAY) / HOUR);
    const m = Math.floor((ms % HOUR) / MIN);
    const sec = Math.floor((ms % MIN) / 1000);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${String(sec).padStart(2, "0")}s`;
    return `${m}m ${String(sec).padStart(2, "0")}s`;
  },
};

export const dayKey = (ms: number) => fmt.date(ms);

export function currentRound(s: State): Round | undefined {
  return [...s.lead.rounds].reverse().find((r) => r.status === "booked");
}
export function completedRounds(s: State) {
  return s.lead.rounds.filter((r) => r.status === "completed");
}
export function slotById(s: State, id: string | null | undefined) {
  return s.slots.find((x) => x.id === id);
}
export function hoursUntil(s: State, ms: number) {
  return (ms - s.now) / HOUR;
}

/** 3-3-3 window: only the next N days that still have free slots are visible. */
export function bookingWindow(s: State) {
  const future = s.slots.filter((x) => !x.removed && x.start > s.now + 2 * HOUR);
  const days: string[] = [];
  future.forEach((x) => {
    const k = dayKey(x.start);
    if (!days.includes(k)) days.push(k);
  });
  const n = s.cfg.visibleDays;
  let chunk = 0;
  let exhaustedChunks = 0;
  for (; chunk * n < days.length; chunk++) {
    const ds = days.slice(chunk * n, chunk * n + n);
    const free = future.filter((x) => ds.includes(dayKey(x.start)) && !x.taken);
    if (free.length) {
      const all = future.filter((x) => ds.includes(dayKey(x.start)));
      return { days: ds, slots: all, free: free.length, total: all.length, exhaustedChunks, none: false };
    }
    exhaustedChunks++;
  }
  return { days: [] as string[], slots: [] as Slot[], free: 0, total: 0, exhaustedChunks, none: true };
}

export function nextMidnight(s: State) {
  const d = new Date(s.now + 5.5 * HOUR);
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime() - 5.5 * HOUR;
}

export function scholarship(s: State) {
  const score = s.offer.rubric.reduce((a, b) => a + b, 0);
  const t = TIERS.find((x) => score >= x.min)!;
  const final = s.offer.final ?? t.pct;
  const delta = final - t.pct;
  const needsVidit = Math.abs(delta) > 5;
  const tuition = FEES.term1 + FEES.term2;
  const amt = (tuition * final) / 100;
  return {
    score,
    tier: t.tier,
    rec: t.pct,
    final,
    delta,
    needsVidit,
    amt,
    term1: FEES.term1 - (amt * FEES.term1) / tuition,
    term2: FEES.term2 - (amt * FEES.term2) / tuition,
    total: FEES.admission + tuition - amt,
  };
}

// ---------- Flow A actions ----------
function meetLink() {
  const a = "abcdefghijkmnopqrstuvwxyz";
  const pick = (n: number) => Array.from({ length: n }, () => a[Math.floor(Math.random() * a.length)]).join("");
  return `meet.google.com/${pick(3)}-${pick(4)}-${pick(3)}`;
}

export function book(s: State, slotId: string) {
  const slot = slotById(s, slotId);
  if (!slot || slot.taken) return toast(s, "That slot was just taken — pick another one.");
  slot.taken = true;
  const r: Round = { n: s.lead.round, slotId, iv: slot.iv, start: slot.start, meet: meetLink(), status: "booked" };
  s.lead.rounds.push(r);
  s.lead.stage = "booked";
  s.lead.notice = null;
  s.ui.review = null;
  act(s, "System", `R${r.n} booked by lead · ${fmt.dt(slot.start)} with ${slot.iv} · GMeet auto-created, both calendars blocked`);
  email(s, `Round ${r.n} interview confirmed — ${fmt.date(slot.start)}`, [
    `Hi ${s.lead.first}, your Round ${r.n} interview is confirmed.`,
    `${fmt.longDate(slot.start)} · ${fmt.slot(slot.start)} (30-min interview + 15-min buffer).`,
    "Your join link, calendar invite and prep kit are on your dashboard.",
  ], "Open dashboard", "Booking");
}

export function bookFirst(s: State, minLeadHours = 30) {
  const w = bookingWindow(s);
  const slot =
    w.slots.find((x) => !x.taken && x.start - s.now > minLeadHours * HOUR) ||
    s.slots.find((x) => !x.taken && !x.removed && x.start - s.now > minLeadHours * HOUR);
  if (slot) book(s, slot.id);
  return slot;
}

export function reschedule(s: State, newId: string, reason: string, detail: string, doc: boolean) {
  const r = currentRound(s);
  const slot = slotById(s, newId);
  if (!r || !slot || slot.taken) return toast(s, "Couldn’t reschedule — pick another slot.");
  if (hoursUntil(s, r.start) < RESCHEDULE_CUTOFF_H) return toast(s, "Rescheduling closes 24 hours before the interview.");
  const old = slotById(s, r.slotId);
  if (old) old.taken = false;
  slot.taken = true;
  s.lead.reschedules.push({ at: s.now, reason, from: r.start, to: slot.start });
  const from = r.start;
  r.slotId = slot.id;
  r.start = slot.start;
  r.iv = slot.iv;
  s.ui.resched = false;
  s.ui.reschedSel = null;
  act(s, "Lead", `R${r.n} rescheduled (#${s.lead.reschedules.length}) ${fmt.dt(from)} → ${fmt.dt(slot.start)} · reason: ${reason}${detail ? ` — “${detail}”` : ""}${doc ? " · doc attached" : ""} · no fee (count instrumented)`);
  email(s, `Interview rescheduled — ${fmt.date(slot.start)}`, [
    `Hi ${s.lead.first}, your Round ${r.n} interview has moved.`,
    `New time: ${fmt.longDate(slot.start)} · ${fmt.slot(slot.start)}.`,
    "Interviewer calendar updated automatically. Same join link on your dashboard.",
  ], "Open dashboard", "Reschedule");
}

export function interviewerBail(s: State) {
  const r = currentRound(s);
  if (!r) return toast(s, "No booked interview to reassign.");
  const old = slotById(s, r.slotId);
  if (old) {
    old.taken = false;
    old.removed = true;
  }
  r.status = "cancelled";
  s.lead.stage = "shortlisted";
  s.lead.notice = "bail";
  act(s, "Counsellor", `Interviewer ${r.iv} unavailable for R${r.n} · slots re-offered to lead (not counted as a lead reschedule)`);
  email(s, "Your interviewer can’t make it — pick a new time", [
    `Hi ${s.lead.first}, ${r.iv} is no longer available on ${fmt.date(r.start)}.`,
    "Sorry about this. Pick any open slot on your dashboard — this does not count as a reschedule.",
  ], "Pick a new slot", "Reassignment");
}

export function markNoShow(s: State, by = "Interviewer") {
  const r = currentRound(s);
  if (!r) return toast(s, "No booked interview.");
  r.status = "no_show";
  s.lead.noShows++;
  s.lead.stage = "no_show";
  act(s, by, `R${r.n} marked no-show · no fee for now · awaiting counsellor reopen`);
  email(s, "We missed you at your interview", [
    `Hi ${s.lead.first}, you didn’t join your Round ${r.n} interview on ${fmt.date(r.start)}.`,
    `Your counsellor ${s.lead.counsellor.name} will reach out to reopen booking. There’s no fee.`,
  ], "Open dashboard", "No-show");
}

export function reopenBooking(s: State) {
  s.lead.stage = "shortlisted";
  s.lead.notice = "reopened";
  s.lead.unblocks++;
  act(s, "Counsellor", `Booking reopened for R${s.lead.round} by counsellor (no tech needed)`);
  email(s, "You can book your interview again", [
    `Hi ${s.lead.first}, your counsellor has reopened booking for Round ${s.lead.round}.`,
    "Pick a time that works on your dashboard.",
  ], "Book a slot", "Reopen");
}

export function submitFeedback(s: State, fb: Feedback) {
  const r = currentRound(s);
  if (!r) return toast(s, "Nothing to submit feedback for.");
  r.status = "completed";
  r.feedback = fb;
  r.summary =
    "Auto-summary (from recording transcript): structured the case well, sized the market with reasonable assumptions, needed a nudge on unit economics. Clear on why an MBA now.";
  s.lead.stage = "round_done";
  s.ui.feedbackFor = null;
  act(s, "Interviewer", `R${r.n} feedback submitted · verdict ${fb.verdict.toUpperCase()} · avg ${(fb.scores.reduce((a, b) => a + b, 0) / fb.scores.length).toFixed(1)}/5 → interview marked Completed`);
  act(s, "System", `R${r.n} recording → transcript + summary pushed to CRM`);
}

export function nextRound(s: State) {
  if (s.lead.round >= MAX_ROUNDS) return toast(s, "Round cap reached (max 4). Move to final verdict.");
  s.lead.round++;
  s.lead.stage = "shortlisted";
  s.lead.notice = "next_round";
  act(s, "Counsellor", `R${s.lead.round} requested (second opinion / intent-led push) · round ${s.lead.round} of max ${MAX_ROUNDS}`);
  email(s, `Your application status has been updated`, [
    `Hi ${s.lead.first}, you’ve been invited to Round ${s.lead.round}.`,
    "Book your slot on your dashboard.",
  ], "Book Round " + s.lead.round, "Next round");
}

export function toFinal(s: State) {
  s.lead.stage = "decision_pending";
  act(s, "Counsellor", "Sent for final verdict (Adhiraj; Vidit on escalation)");
}

export function waitlist(s: State, by: string) {
  s.lead.stage = "waitlisted";
  act(s, by, "Decision: Waitlisted (borderline) · stays in funnel · reviewed each round");
  email(s, "An update on your application", [
    `Hi ${s.lead.first}, you’re on our waitlist.`,
    "Your application stays active and is reviewed each round. You can keep your profile up to date from your dashboard.",
  ], "Open dashboard", "Waitlist");
}

export function reject(s: State, by: string) {
  if (s.cfg.lateCohort) return toast(s, "Late in cohort — waitlist instead of reject.");
  s.lead.stage = "rejected";
  s.lead.rejectedAt = s.now;
  act(s, by, `Decision: Rejected · reapply after ${COOLDOWN_DAYS}-day cooldown at full application fee`);
  email(s, "An update on your application", [
    `Hi ${s.lead.first}, we’re unable to move forward with your application this time.`,
    `You can reapply after ${fmt.longDate(s.now + COOLDOWN_DAYS * DAY)} (full application fee applies).`,
  ], "Open dashboard", "Reject");
}

export function approve(s: State, who: "Adhiraj" | "Vidit") {
  if (completedRounds(s).length < MIN_ROUNDS_FOR_OFFER) return toast(s, "Needs at least 2 completed rounds before an offer.");
  s.lead.stage = "approved";
  s.offer.status = "scholarship";
  s.offer.approvedBy = who;
  if (s.offer.escalation === "pending") s.offer.escalation = "overridden";
  act(s, who, `Approved for offer${who === "Vidit" && s.offer.escalation === "overridden" ? " (override)" : ""}`, true);
}

export function escalate(s: State, by: string) {
  s.offer.escalation = "pending";
  act(s, by, "Escalated to Vidit for final verdict");
}

export function uphold(s: State, outcome: "waitlist" | "reject") {
  s.offer.escalation = "upheld";
  act(s, "Vidit", `Escalation reviewed — no override (${outcome})`);
  if (outcome === "waitlist") waitlist(s, "Vidit");
  else reject(s, "Vidit");
}

export function updateProfile(s: State, note: string) {
  s.lead.profileUpdates.push({ at: s.now, note });
  s.ui.editProfile = false;
  act(s, "Lead", `Waitlist profile updated: ${note}`);
  toast(s, "Profile updated — your counsellor can see it.");
}

// ---------- Flow B actions ----------
export function saveScholarship(s: State, by: string) {
  const sc = scholarship(s);
  if (sc.needsVidit && s.offer.exception !== "approved")
    return toast(s, "Change beyond ±5% needs Vidit’s approval first.");
  const prev = s.offer.pct;
  s.offer.pct = sc.final;
  act(s, by, `Scholarship set: score ${sc.score}/10 → ${sc.tier} → rec ${sc.rec}% · final ${sc.final}%${sc.needsVidit ? " (Vidit-approved exception)" : ""}`);
  if (s.offer.status === "live" || s.offer.status === "expired") {
    s.offer.version++;
    s.offer.revisions.unshift({ at: s.now, kind: "Revised", note: `Scholarship ${prev}% → ${sc.final}% · letters regenerated · new link`, version: s.offer.version });
    s.offer.status = "live";
    s.offer.deadline = s.now + s.cfg.deadlineDays * DAY;
    s.offer.audit = [false, false, false];
    act(s, by, `Offer revised (v${s.offer.version}) · new link + revised letter sent`);
    email(s, "Your revised offer from Scaler School of Business", [
      `Hi ${s.lead.first}, your offer has been revised.`,
      `Scholarship: ${sc.final}% (was ${prev}%). Revised letters attached; previous link no longer valid.`,
      `Pay by ${fmt.longDate(s.offer.deadline)} to confirm your seat.`,
    ], "Review revised offer", "Revised offer");
  } else {
    s.offer.status = "letters";
    s.offer.audit = [false, false, false];
  }
}

export function sendOffer(s: State, by: string) {
  if (s.offer.audit.some((x) => !x)) return toast(s, "Complete the preview/audit checklist before sending.");
  s.offer.status = "live";
  s.offer.version = Math.max(1, s.offer.version);
  s.offer.deadline = s.now + s.cfg.deadlineDays * DAY;
  s.offer.revisions.unshift({ at: s.now, kind: "Sent", note: `Offer v${s.offer.version} sent from official SSB ID · deadline ${s.cfg.deadlineDays} days`, version: s.offer.version });
  act(s, by, `Offer sent from official SSB ID · email + dashboard in sync · deadline ${fmt.dt(s.offer.deadline)}`);
  const sc = scholarship(s);
  email(s, "Your offer from Scaler School of Business", [
    `Congratulations ${s.lead.first} — you’ve been offered provisional admission.`,
    "Attached: Provisional admission letter (with full payment schedule, usable for bank/loan applications)" + (sc.final > 0 ? ` and Scholarship letter (${sc.final}%).` : "."),
    `Pay the admission fee of ${fmt.money(FEES.admission)} on your dashboard by ${fmt.longDate(s.offer.deadline)} to confirm your seat.`,
  ], "View offer & pay", "Offer");
}

export function extendOffer(s: State, by: string, days: number) {
  const base = Math.max(s.now, s.offer.deadline ?? s.now);
  s.offer.deadline = base + days * DAY;
  s.offer.status = "live";
  s.offer.extensions++;
  s.offer.revisions.unshift({ at: s.now, kind: "Extended", note: `Expiry extended by ${days} days → ${fmt.dt(s.offer.deadline)}`, version: s.offer.version });
  act(s, by, `Offer expiry extended +${days}d`);
  email(s, "Your offer deadline has been extended", [
    `Hi ${s.lead.first}, you now have until ${fmt.longDate(s.offer.deadline)} to confirm your seat.`,
  ], "View offer & pay", "Extension");
}

export function resendOffer(s: State, by: string) {
  s.offer.deadline = s.now + s.cfg.deadlineDays * DAY;
  s.offer.status = "live";
  s.offer.revisions.unshift({ at: s.now, kind: "Resent", note: `Offer v${s.offer.version} resent · fresh ${s.cfg.deadlineDays}-day deadline`, version: s.offer.version });
  act(s, by, "Offer resent (same letters, fresh link)");
  email(s, "Your offer from Scaler School of Business (resent)", [
    `Hi ${s.lead.first}, here’s your offer again with a fresh payment link on your dashboard.`,
    `Pay by ${fmt.longDate(s.offer.deadline)}.`,
  ], "View offer & pay", "Resent");
}

export function checkExpiry(s: State) {
  if (s.offer.status === "live" && s.offer.deadline && s.now > s.offer.deadline) {
    s.offer.status = "expired";
    s.offer.revisions.unshift({ at: s.offer.deadline, kind: "Expired", note: "Deadline passed — waiting on counsellor action (no auto-waitlist)", version: s.offer.version });
    act(s, "System", "Offer expired · counsellor action needed (resend / extend / change scholarship)");
    return true;
  }
  return false;
}

export function pay(s: State, gw: "PhonePe" | "Razorpay") {
  const ok = !(gw === "PhonePe" && s.cfg.phonepeDown);
  s.offer.payments.push({ at: s.now, gw, ok });
  if (!ok) {
    s.ui.pay = { gw: "Razorpay", phase: "failed" };
    act(s, "System", "Payment attempt failed on PhonePe · Razorpay backup offered");
    return false;
  }
  s.ui.pay = null;
  s.offer.status = "accepted";
  act(s, "System", `Admission fee ${fmt.money(FEES.admission)} paid via ${gw} · reconciled → auto-marked Accepted · loan + term-1 checklist triggered`);
  email(s, "Welcome to Scaler School of Business 🎉", [
    `Congratulations ${s.lead.first}, your seat is confirmed.`,
    "A note from Shan & Adhiraj is on your dashboard, along with your onboarding form.",
  ], "Complete onboarding", "Accepted");
  return true;
}

export function submitOnboarding(s: State, loan: boolean, type: "salaried" | "family") {
  s.offer.onboarding = { submitted: true, loan, type, at: s.now };
  act(s, "Lead", `Onboarding form submitted → CRM${loan ? " · loan-taker financial docs attached" : ""}${type === "family" ? " · family-business applicant (no salary slips)" : ""}`);
}

// ---------- Mock cohort for stats ----------
export type CohortLead = {
  name: string;
  stage: Stage | "offer_live" | "accepted" | "expired";
  booked: boolean;
  reschedules: number;
  noShows: number;
  rounds: number;
  scholarship: number | null;
  gwFail: number;
  owner: string;
};
const FIRST = ["Rohit", "Isha", "Kabir", "Neha", "Arjun", "Sana", "Dev", "Tara", "Vikram", "Meher", "Aditya", "Riya", "Yash", "Pooja", "Nikhil", "Anaya", "Kunal", "Diya", "Varun", "Zoya", "Pranav", "Ira", "Siddharth", "Mira", "Harsh", "Kavya", "Omkar", "Aisha", "Rahul", "Nisha", "Ayaan", "Ritika", "Manav", "Sneha", "Gaurav", "Tanvi", "Ishaan", "Anvi", "Karthik", "Simran", "Rehan", "Leah", "Parth", "Jiya", "Vivek", "Ahana", "Sahil"];
const LAST = ["Shah", "Iyer", "Kapoor", "Nair", "Gupta", "Reddy", "Bose", "Malhotra", "Joshi", "Menon", "Verma", "Das"];
const COHORT_STAGES: CohortLead["stage"][] = ["shortlisted", "shortlisted", "booked", "booked", "booked", "round_done", "decision_pending", "waitlisted", "rejected", "offer_live", "accepted", "accepted", "no_show", "expired", "booked", "waitlisted"];

export const COHORT: CohortLead[] = FIRST.map((f, i) => {
  const stage = COHORT_STAGES[(i * 7) % COHORT_STAGES.length];
  const booked = stage !== "shortlisted";
  const offer = stage === "offer_live" || stage === "accepted" || stage === "expired";
  return {
    name: `${f} ${LAST[(i * 5) % LAST.length]}`,
    stage,
    booked,
    reschedules: booked ? [0, 0, 1, 0, 2, 0, 1, 0, 0, 3][i % 10] : 0,
    noShows: stage === "no_show" ? 1 : i % 13 === 0 ? 1 : 0,
    rounds: offer ? 2 + (i % 2) : stage === "decision_pending" || stage === "waitlisted" || stage === "rejected" ? 1 + (i % 3) : booked ? 1 : 0,
    scholarship: offer ? [10, 20, 10, 30, 0, 20, 25][i % 7] : null,
    gwFail: offer && i % 4 === 0 ? 1 : 0,
    owner: ["Riya Kapoor", "Aman Sethi", "Pallavi Rao"][i % 3],
  };
});
