// Every edge case from the build scope as a jumpable scenario.
import {
  State, initialState, bookFirst, currentRound, HOUR, MIN, DAY, submitFeedback, nextRound, toFinal,
  waitlist, reject, approve, markNoShow, interviewerBail, reschedule, bookingWindow, saveScholarship,
  sendOffer, escalate, pay, checkExpiry, act,
} from "./model";

export type Scenario = {
  id: string;
  group: "Flow A · Lead" | "Interviewer platform" | "Admissions / CRM" | "Flow B · Admin" | "Flow B · Lead";
  title: string;
  rule: string;
  route: "/lead" | "/interviewer" | "/admin";
  build: (s: State) => void;
};

const yes = { scores: [4, 4, 3, 5, 4], notes: ["", "", "", "", ""], verdict: "yes" as const, remark: "Strong intent, solid structure." };

function completeRound(s: State) {
  const slot = bookFirst(s);
  if (!slot) return;
  s.now = slot.start + 50 * MIN;
  submitFeedback(s, yes);
}
function twoRoundsToDecision(s: State) {
  completeRound(s);
  nextRound(s);
  completeRound(s);
  toFinal(s);
}
function approvedAndScholarship(s: State) {
  twoRoundsToDecision(s);
  approve(s, "Adhiraj");
  saveScholarship(s, "Riya Kapoor");
}
function offerLive(s: State) {
  approvedAndScholarship(s);
  s.offer.audit = [true, true, true];
  sendOffer(s, "Riya Kapoor");
}

export const SCENARIOS: Scenario[] = [
  // ---- Flow A lead
  { id: "A1", group: "Flow A · Lead", title: "Shortlist email → dashboard", rule: "Shortlist email only says “status updated, check your dashboard”.", route: "/lead", build: (s) => { s.ui.leadTab = "inbox"; } },
  { id: "A2", group: "Flow A · Lead", title: "Book own slot (3-3-3 window + FOMO)", rule: "Only next 3 days visible · seats-left meter + refresh timer · no booking deadline.", route: "/lead", build: () => {} },
  { id: "A3", group: "Flow A · Lead", title: "Window exhausted → next 3 days", rule: "When the visible 3 days fill up, the next 3 days open.", route: "/lead", build: (s) => { const w = bookingWindow(s); w.slots.forEach((x) => (x.taken = true)); } },
  { id: "A4", group: "Flow A · Lead", title: "No interviewer supply", rule: "No slots at all → lead sees a holding state; counsellor can request callback.", route: "/lead", build: (s) => { s.slots.forEach((x) => (x.taken = true)); } },
  { id: "A5", group: "Flow A · Lead", title: "Confirmation + prep screen", rule: "Join link · add to calendar · prep kit · AI mock (Anshuman voice) · request callback. 30 min + 15 min buffer.", route: "/lead", build: (s) => { bookFirst(s); } },
  { id: "A6", group: "Flow A · Lead", title: "Reschedule (≥24 h, reason mandatory)", rule: "Reason mandatory, doc optional, no fee — count tracked per user.", route: "/lead", build: (s) => { bookFirst(s, 40); s.ui.resched = true; } },
  { id: "A7", group: "Flow A · Lead", title: "Reschedule locked (<24 h)", rule: "Lead can’t reschedule inside 24 h; contact counsellor instead.", route: "/lead", build: (s) => { const sl = bookFirst(s); if (sl) s.now = sl.start - 20 * HOUR; } },
  { id: "A8", group: "Flow A · Lead", title: "Repeat rescheduler (3×, still free)", rule: "No fee for now — reschedules instrumented per user to inform the fee call.", route: "/admin", build: (s) => { bookFirst(s, 40); for (let i = 0; i < 3; i++) { const r = currentRound(s)!; const w = bookingWindow(s); const nx = w.slots.find((x) => !x.taken && x.start > r.start + DAY) || s.slots.find((x) => !x.taken && x.start > r.start + DAY); if (nx) reschedule(s, nx.id, ["Work conflict", "Travel", "Health"][i], "", i === 2); } s.ui.adTab = "lead"; } },
  { id: "A9", group: "Flow A · Lead", title: "Interviewer bails → slots re-offered", rule: "Interviewer bailing → re-offer slots + notify lead; not counted as lead reschedule.", route: "/lead", build: (s) => { bookFirst(s); interviewerBail(s); } },
  { id: "A10", group: "Flow A · Lead", title: "No-show → counsellor reopens", rule: "No fee for now · counsellor/admin reopens & rebooks without tech.", route: "/lead", build: (s) => { const sl = bookFirst(s); if (sl) s.now = sl.start + 50 * MIN; markNoShow(s); } },
  { id: "A11", group: "Flow A · Lead", title: "Interview done, awaiting feedback", rule: "“Completed” is gated on interviewer feedback submit.", route: "/lead", build: (s) => { const sl = bookFirst(s); if (sl) s.now = sl.start + 50 * MIN; } },
  { id: "A12", group: "Flow A · Lead", title: "Next round invite (R2)", rule: "R2–R4 for second/third opinions or intent-led pushes.", route: "/lead", build: (s) => { completeRound(s); nextRound(s); } },
  { id: "A13", group: "Flow A · Lead", title: "Round cap reached (R4)", rule: "Hard cap 4 rounds — after R4 the only path is final verdict.", route: "/admin", build: (s) => { completeRound(s); for (let i = 0; i < 3; i++) { nextRound(s); completeRound(s); } s.ui.adTab = "lead"; } },
  { id: "A14", group: "Flow A · Lead", title: "Decision pending", rule: "Final verdict by Adhiraj (Vidit on escalation).", route: "/lead", build: (s) => { completeRound(s); toFinal(s); } },
  { id: "A15", group: "Flow A · Lead", title: "Waitlisted (borderline)", rule: "Stays in funnel · no reapply · can update profile · reviewed each round.", route: "/lead", build: (s) => { completeRound(s); toFinal(s); waitlist(s, "Adhiraj"); } },
  { id: "A16", group: "Flow A · Lead", title: "Waitlist profile update", rule: "Waitlisted lead updates profile; counsellor sees it on CRM.", route: "/lead", build: (s) => { completeRound(s); toFinal(s); waitlist(s, "Adhiraj"); s.ui.editProfile = true; } },
  { id: "A17", group: "Flow A · Lead", title: "Rejected → cooldown reapply", rule: "Worst profiles only · reapply after ~1 month at full application fee.", route: "/lead", build: (s) => { completeRound(s); toFinal(s); reject(s, "Adhiraj"); } },
  { id: "A18", group: "Flow A · Lead", title: "Late cohort: reject blocked → waitlist", rule: "Late in cohort → waitlist, don’t reject.", route: "/admin", build: (s) => { completeRound(s); toFinal(s); s.cfg.lateCohort = true; s.ui.adTab = "lead"; } },
  // ---- Interviewer
  { id: "I1", group: "Interviewer platform", title: "Onboarding + contract sign", rule: "Mentor-dashboard reuse · contractor · ₹700 per completed interview.", route: "/interviewer", build: (s) => { s.iv.onboarded = false; s.iv.contractSigned = false; s.ui.ivTab = "onboarding"; } },
  { id: "I2", group: "Interviewer platform", title: "Self-serve slots (add / remove)", rule: "Add/remove own slots; booked slots can’t be removed (reassign instead).", route: "/interviewer", build: (s) => { bookFirst(s); s.ui.ivTab = "slots"; } },
  { id: "I3", group: "Interviewer platform", title: "Feedback form gates “Completed”", rule: "Per-question fields + yes/no verdict → CRM · no Google Form.", route: "/interviewer", build: (s) => { const sl = bookFirst(s); if (sl) s.now = sl.start + 45 * MIN; s.ui.ivTab = "feedback"; } },
  { id: "I4", group: "Interviewer platform", title: "Upcoming / completed / missed", rule: "Interview list with states; mark no-show for missed.", route: "/interviewer", build: (s) => { bookFirst(s); s.ui.ivTab = "interviews"; } },
  { id: "I5", group: "Interviewer platform", title: "Monthly payout report", rule: "Completed × ₹700 · monthly report to finance, not automated.", route: "/interviewer", build: (s) => { completeRound(s); s.ui.ivTab = "payouts"; } },
  // ---- Admin / CRM
  { id: "C1", group: "Admissions / CRM", title: "Booking control + non-bookers", rule: "Admin controls visible days · non-bookers tracked (threshold TBD).", route: "/admin", build: (s) => { s.ui.adTab = "booking"; } },
  { id: "C2", group: "Admissions / CRM", title: "Full lead card (rounds, transcript)", rule: "Rounds, verdicts, feedback, CTC, LinkedIn, VE, transcript summary on CRM.", route: "/admin", build: (s) => { twoRoundsToDecision(s); s.ui.adTab = "lead"; } },
  { id: "C3", group: "Admissions / CRM", title: "Stuck lead unblocked by counsellor", rule: "Any stuck lead must be unblockable by a counsellor without tech.", route: "/admin", build: (s) => { const sl = bookFirst(s); if (sl) s.now = sl.start + 50 * MIN; markNoShow(s); s.ui.adTab = "lead"; } },
  { id: "C4", group: "Admissions / CRM", title: "Waitlist & reject pools", rule: "Waitlist pool view + nurture notes; reject comms + cooldown.", route: "/admin", build: (s) => { completeRound(s); toFinal(s); waitlist(s, "Adhiraj"); s.ui.adTab = "pipeline"; } },
  // ---- Flow B admin
  { id: "O1", group: "Flow B · Admin", title: "Approval blocked with <2 rounds", rule: "Trigger: at least 2 rounds completed before “Approved for offer”.", route: "/admin", build: (s) => { completeRound(s); toFinal(s); s.role = "adhiraj"; s.ui.adTab = "lead"; } },
  { id: "O2", group: "Flow B · Admin", title: "Only Adhiraj / Vidit can approve", rule: "Reserved CRM activity “Approved for offer” — counsellor can’t add it.", route: "/admin", build: (s) => { twoRoundsToDecision(s); s.role = "counsellor"; s.ui.adTab = "lead"; } },
  { id: "O3", group: "Flow B · Admin", title: "Escalation → Vidit override", rule: "Vidit can override → offer proceeds; else waitlist/reject. Override logged.", route: "/admin", build: (s) => { twoRoundsToDecision(s); escalate(s, "Adhiraj"); s.role = "vidit"; s.ui.adTab = "lead"; } },
  { id: "O4", group: "Flow B · Admin", title: "Scholarship within ±5%", rule: "Rubric 5×0–2 → /10 → tier → rec %; counsellor holds ±5%.", route: "/admin", build: (s) => { twoRoundsToDecision(s); approve(s, "Adhiraj"); s.ui.adTab = "scholarship"; } },
  { id: "O5", group: "Flow B · Admin", title: "Scholarship >5% needs Vidit", rule: "Over 5% needs Vidit; logged approval.", route: "/admin", build: (s) => { twoRoundsToDecision(s); approve(s, "Adhiraj"); s.offer.final = 30; s.ui.adTab = "scholarship"; } },
  { id: "O6", group: "Flow B · Admin", title: "Letter preview / audit before send", rule: "Fixed templates · official SSB ID · mandatory preview/audit.", route: "/admin", build: (s) => { approvedAndScholarship(s); s.ui.adTab = "letters"; } },
  { id: "O7", group: "Flow B · Admin", title: "Offer tracking + revision history", rule: "Offer states on CRM record · resend / extend / revise · no O2A sheet.", route: "/admin", build: (s) => { offerLive(s); s.ui.adTab = "tracking"; } },
  // ---- Flow B lead
  { id: "L1", group: "Flow B · Lead", title: "Offer email (in sync with dashboard)", rule: "Provisional admission letter + scholarship letter; points to dashboard.", route: "/lead", build: (s) => { offerLive(s); s.ui.leadTab = "inbox"; } },
  { id: "L2", group: "Flow B · Lead", title: "Offer live with 7-day timer", rule: "Payment on dashboard · deadline default 7 days, counsellor-settable.", route: "/lead", build: (s) => { offerLive(s); } },
  { id: "L3", group: "Flow B · Lead", title: "Checkout — PhonePe primary", rule: "PhonePe API primary + Razorpay backup · no pasted links.", route: "/lead", build: (s) => { offerLive(s); s.ui.pay = { gw: "PhonePe", phase: "choose" }; } },
  { id: "L4", group: "Flow B · Lead", title: "PhonePe fails → Razorpay backup", rule: "PhonePe failure rate last cohort → backup gateway offered inline.", route: "/lead", build: (s) => { offerLive(s); s.cfg.phonepeDown = true; pay(s, "PhonePe"); } },
  { id: "L5", group: "Flow B · Lead", title: "Offer expired (no auto-waitlist)", rule: "Deadline passes → counsellor resend / extend / change scholarship.", route: "/lead", build: (s) => { offerLive(s); s.now = (s.offer.deadline ?? s.now) + HOUR; checkExpiry(s); } },
  { id: "L6", group: "Flow B · Lead", title: "Revised offer (new letter + link)", rule: "Scholarship change regenerates letters · revision history kept.", route: "/lead", build: (s) => { offerLive(s); s.offer.final = 25; saveScholarship(s, "Riya Kapoor"); } },
  { id: "L7", group: "Flow B · Lead", title: "Accepted → congratulations + onboarding", rule: "Payment verified → auto-marked accepted → onboarding form only.", route: "/lead", build: (s) => { offerLive(s); pay(s, "PhonePe"); } },
  { id: "L8", group: "Flow B · Lead", title: "Loan-taker financial docs sub-flow", rule: "Financial docs only for loan-takers.", route: "/lead", build: (s) => { offerLive(s); pay(s, "PhonePe"); s.ui.onboardingLoan = true; } },
  { id: "L9", group: "Flow B · Lead", title: "Family-business applicant (FBM)", rule: "Open decision: FBM leads have no salary slips / last-org fields.", route: "/lead", build: (s) => { offerLive(s); pay(s, "PhonePe"); s.ui.onboardingLoan = true; s.ui.onboardingType = "family"; } },
  { id: "L10", group: "Flow B · Lead", title: "Onboarding submitted → CRM", rule: "Form fields from Shan + Adhiraj → CRM.", route: "/lead", build: (s) => { offerLive(s); pay(s, "PhonePe"); s.offer.onboarding = { submitted: true, loan: false, type: "salaried", at: s.now }; act(s, "Lead", "Onboarding form submitted → CRM"); } },
];

export function buildScenario(id: string): State {
  const s = initialState();
  const sc = SCENARIOS.find((x) => x.id === id);
  sc?.build(s);
  s.ui.toast = null;
  return s;
}
