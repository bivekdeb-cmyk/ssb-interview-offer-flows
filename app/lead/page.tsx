"use client";
import React, { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, EnvelopeSimple, List, X, YoutubeLogo, ArrowsClockwise, CalendarCheck, Clock, Copy, DownloadSimple, CalendarPlus, Headset, LockKey, LockSimple, CaretDown, ChatsCircle, Check, ClipboardText, Eye, FileText, FlagBanner, GraduationCap, Phone, Play, Receipt, Sparkle, UploadSimple, VideoCamera, WhatsappLogo, Warning } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import {
  bookingWindow, book, currentRound, fmt, hoursUntil, slotById, RESCHEDULE_CUTOFF_H, MAX_ROUNDS, reschedule, nextMidnight,
  dayKey, MIN, INTERVIEW_MIN, BUFFER_MIN, COOLDOWN_DAYS, DAY, FEES, scholarship, pay, submitOnboarding, updateProfile,
  RESCHEDULE_REASONS, State, completedRounds,
} from "@/lib/model";
import { Avatar, Btn, Card, Field, IllusCard, Intro, KV, Logo, Notice, Tag } from "@/components/ui";
import { IMG } from "@/lib/images";

const Countdown = ({ to }: { to: number }) => {
  const { s } = useStore();
  return <>{fmt.dur(to - s.now)}</>;
};

function screenName(s: State): string {
  if (s.ui.leadTab === "inbox") return "Inbox · emails point to dashboard";
  const L = s.lead, O = s.offer;
  if (L.stage === "approved") {
    if (O.status === "accepted") return O.onboarding?.submitted ? "Onboarding submitted" : "Accepted · onboarding form";
    if (O.status === "live") return s.ui.pay ? (s.ui.pay.phase === "failed" ? "Payment failed · backup gateway" : "Checkout") : "Offer live";
    if (O.status === "expired") return "Offer expired";
    return "Approved · offer being prepared";
  }
  const r = currentRound(s);
  if (L.stage === "booked" && r) {
    if (s.ui.resched) return "Reschedule";
    if (s.now > r.start + INTERVIEW_MIN * MIN) return "Interview done · awaiting feedback";
    return "Booked · confirmation & prep";
  }
  return ({ shortlisted: s.ui.review ? "Review slot" : "Book slot", round_done: "Round complete", no_show: "No-show", decision_pending: "Decision pending", waitlisted: s.ui.editProfile ? "Waitlist · update profile" : "Waitlisted", rejected: "Rejected · cooldown" } as Record<string, string>)[L.stage] ?? L.stage;
}

export default function LeadPage() {
  const { s, update } = useStore();
  const [menu, setMenu] = useState(false);
  const L = s.lead;
  const offerStage = L.stage === "approved";
  const accepted = s.offer.status === "accepted";
  const r = currentRound(s);
  const doneRounds = completedRounds(s).length;
  const interviewSub = offerStage
    ? `${doneRounds} round${doneRounds === 1 ? "" : "s"} · cleared`
    : ({
        shortlisted: `Round ${L.round} · book your slot`,
        booked: r ? `Round ${r.n} · ${fmt.date(r.start)}` : `Round ${L.round}`,
        round_done: `Round ${L.round} · under review`,
        no_show: "Missed · rebooking",
        decision_pending: "Final review",
        waitlisted: "On waitlist",
        rejected: "Not moving forward",
      } as Record<string, string>)[L.stage] ?? "";
  const offerSub = accepted ? "Seat confirmed" : !offerStage ? "Unlocks after interview" : s.offer.status === "live" ? `Pay by ${fmt.date(s.offer.deadline!)}` : s.offer.status === "expired" ? "Expired · talk to counsellor" : "Being prepared";
  const steps: [string, string, "done" | "on" | "", React.ReactNode][] = [
    ["Application fee", "Paid · 2 Nov", "done", <Receipt key="a" size={18} />],
    ["Application form", "Submitted · 4 Nov", "done", <ClipboardText key="b" size={18} />],
    ["Interview", interviewSub, offerStage ? "done" : "on", <ChatsCircle key="c" size={18} />],
    ["Offer", offerSub, accepted ? "done" : offerStage ? "on" : "", <FlagBanner key="d" size={18} />],
    ["Onboarding", accepted ? (s.offer.onboarding?.submitted ? "Submitted" : "Complete your form") : "Locked", accepted ? (s.offer.onboarding?.submitted ? "done" : "on") : "", <GraduationCap key="e" size={18} />],
  ];
  const doneCount = steps.filter((x) => x[2] === "done").length;
  const unread = s.emails.length;
  return (
    <div className="frame">
      <div className="appnav">
        <Logo />
        <div className="menu">
          <button className="nav-btn" onClick={() => update(callback)}>
            <Headset size={16} />
            Talk to {L.counsellor.name.split(" ")[0]}, your counsellor
          </button>
          <span className="nav-sep" />
          <span className="nav-profile"><Avatar src={IMG.lead} /> {L.name} <CaretDown size={14} className="muted" /></span>
          <button className="m-burger" aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)}>
            <List size={22} />
          </button>
        </div>
      </div>
      {/* mobile: horizontal numbered step strip */}
      <nav className="mstepper" aria-label="Application progress">
        {steps.map(([t, , st], i) => (
          <div key={t} className={`ms-step ${st || "todo"}`} aria-current={st === "on" ? "step" : undefined}>
            <span className="ms-n">{st === "done" ? <Check size={12} weight="bold" /> : i + 1}</span>
            <span className="ms-t">{t}</span>
          </div>
        ))}
      </nav>
      {/* mobile: menu sheet */}
      {menu && (
        <div className="m-sheet-scrim" onClick={() => setMenu(false)}>
          <div className="m-sheet" role="dialog" aria-modal aria-label="Menu" onClick={(e) => e.stopPropagation()}>
            <div className="row between">
              <span className="row" style={{ gap: 10 }}><Avatar src={IMG.lead} size={40} /><b>{L.name}</b></span>
              <button className="m-close" aria-label="Close menu" onClick={() => setMenu(false)}><X size={20} /></button>
            </div>
            <div className="side-sec" style={{ margin: 0 }}>
              <span className="lbl">APPLICATION ID</span>
              <div className="side-appid">
                <b>{L.id}</b>
                <button className="copy-btn" aria-label="Copy application ID" onClick={() => copyText(L.id).then((ok) => update((d) => (d.ui.toast = ok ? "Application ID copied" : `Application ID: ${L.id}`)))}>
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <button className="m-item" onClick={() => { setMenu(false); update(callback); }}><Headset size={18} /> Talk to {L.counsellor.name.split(" ")[0]}, your counsellor</button>
            <button className="m-item" onClick={() => { setMenu(false); update((d) => (d.ui.leadTab = "inbox")); }}><EnvelopeSimple size={18} /> Email inbox ({s.emails.length})</button>
            <div className="m-foot">SSB Admissions Portal · Privacy policy</div>
          </div>
        </div>
      )}
      <div className="ws">
        <aside className="side lead-side">
          <div className="side-sec">
            <span className="lbl">APPLICATION ID</span>
            <div className="side-appid">
              <b>{L.id}</b>
              <button
                className="copy-btn"
                aria-label="Copy application ID"
                title="Copy"
                onClick={() => {
                  copyText(L.id).then((ok) => update((d) => (d.ui.toast = ok ? "Application ID copied" : `Application ID: ${L.id}`)));
                }}
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
          <div className="side-head">
            <span className="lbl" style={{ margin: 0 }}>APPLICATION PROGRESS</span>
            <span className="prog">{doneCount}/{steps.length}</span>
          </div>
          <ol className="tl">
            {steps.map(([t, sub, st, ic]) => (
              <li key={t} className={`tl-step ${st || "todo"}`}>
                <span className="tl-ic">{st === "done" ? <Check size={16} weight="bold" /> : st === "" ? <LockSimple size={16} /> : ic}</span>
                <span className="tl-txt" title={sub}>
                  <b>{t}</b>
                </span>
              </li>
            ))}
          </ol>
          <div className="side-foot">
            <span>SSB Admissions Portal</span>
            <span aria-hidden>·</span>
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy policy</a>
          </div>
        </aside>
        <div className="content lead-content">
          <div className="tabs">
            <button className={s.ui.leadTab === "dashboard" ? "on" : ""} onClick={() => update((d) => (d.ui.leadTab = "dashboard"))}>
              Dashboard
            </button>
            <button className={s.ui.leadTab === "inbox" ? "on" : ""} onClick={() => update((d) => (d.ui.leadTab = "inbox"))}>
              Email inbox ({unread})
            </button>
          </div>
          {s.ui.leadTab === "inbox" ? <Inbox /> : <LeadMain />}
        </div>
      </div>
    </div>
  );
}

function LeadMain() {
  const { s } = useStore();
  const L = s.lead, O = s.offer;
  if (L.stage === "approved") {
    if (O.status === "accepted") return O.onboarding?.submitted ? <OnboardDone /> : <Onboarding />;
    if (O.status === "live") return s.ui.pay ? <Checkout /> : <OfferLive />;
    if (O.status === "expired") return <OfferExpired />;
    return <OfferPreparing />;
  }
  switch (L.stage) {
    case "shortlisted":
      return s.ui.review ? <ReviewSlot /> : <PickSlot />;
    case "booked": {
      const r = currentRound(s);
      if (!r) return <PickSlot />;
      if (s.ui.resched) return <RescheduleForm />;
      if (s.now > r.start + INTERVIEW_MIN * MIN) return <AwaitingFeedback />;
      return <Confirmed />;
    }
    case "round_done":
      return <RoundDone />;
    case "no_show":
      return <NoShow />;
    case "decision_pending":
      return <DecisionPending />;
    case "waitlisted":
      return s.ui.editProfile ? <ProfileForm /> : <Waitlisted />;
    case "rejected":
      return <Rejected />;
  }
  return null;
}

/** Copy with the async Clipboard API, falling back to execCommand where clipboard access is blocked. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** YouTube-style play badge (red rounded rectangle, white triangle). */
function YtBadge() {
  return (
    <span className="yt-badge" aria-hidden>
      <svg width="68" height="48" viewBox="0 0 68 48"><path d="M66.5 7.7c-.8-2.9-2.5-5.4-5.4-6.2C55.8.1 34 0 34 0S12.2.1 6.9 1.6C4 2.4 2.3 4.8 1.5 7.7.1 13 0 24 0 24s.1 11 1.5 16.3c.8 2.9 2.5 5.4 5.4 6.2C12.2 47.9 34 48 34 48s21.8-.1 27.1-1.6c2.9-.8 4.6-3.2 5.4-6.2C67.9 35 68 24 68 24s-.1-11-1.5-16.3z" fill="#FF0000"/><path d="M45 24 27 14v20z" fill="#fff"/></svg>
    </span>
  );
}

/** Sticky bottom action bar — the screen’s main CTA stays visible while content scrolls (web + mobile). */
function CtaBar({ title, sub, children }: { title: React.ReactNode; sub?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="cta-bar" role="region" aria-label="Primary action">
      <div className="cta-txt">
        <b>{title}</b>
        {sub && <span>{sub}</span>}
      </div>
      <div className="cta-act">{children}</div>
    </div>
  );
}

function callback(d: State) {
  d.ui.modal = {
    title: "Request a callback",
    body: [
      `Your counsellor ${d.lead.counsellor.name} will call you back within working hours.`,
      `Call: ${d.lead.counsellor.phone}`,
      `WhatsApp: wa.me/${d.lead.counsellor.phone.replace(/\D/g, "")}`,
      "Callback request logged on CRM.",
    ],
  };
  d.activity.unshift({ at: d.now, who: "Lead", text: "Requested callback from dashboard" });
}

// ---------------- Booking ----------------
function SlotGrid({ sel, onSel, excludeId }: { sel: string | null; onSel: (id: string) => void; excludeId?: string }) {
  const { s } = useStore();
  const w = bookingWindow(s);
  if (w.none) return null;
  return (
    <div className="slots" style={{ gridTemplateColumns: `repeat(${w.days.length}, minmax(0,1fr))` }}>
      {w.days.map((dk) => {
        const ds = w.slots.filter((x) => dayKey(x.start) === dk);
        const free = ds.filter((x) => !x.taken).length;
        return (
          <div className="daycol" key={dk}>
            <h4>{dk}</h4>
            <span className="cap" style={{ color: free <= 2 ? "var(--red)" : undefined }}>
              {free === 0 ? "Fully booked" : `${free} of ${ds.length} slots left`}
            </span>
            {ds.map((x) => (
              <button key={x.id} className={`slot${sel === x.id ? " sel" : ""}`} disabled={x.taken || x.id === excludeId} onClick={() => onSel(x.id)}>
                <span>{fmt.time(x.start)}</span>
                <span className="small muted" style={{ fontWeight: 500 }}>{x.taken ? "Booked" : "30 min"}</span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Fomo() {
  const { s } = useStore();
  const w = bookingWindow(s);
  const pct = w.total ? Math.round(((w.total - w.free) / w.total) * 100) : 100;
  return (
    <div className="card tint" style={{ gap: 10 }}>
      <div className="row between">
        <b>Seats are filling fast — {w.free} of {w.total} slots left in the next {s.cfg.visibleDays} days</b>
        <Tag tone="amber">Slots refresh in <Countdown to={nextMidnight(s)} /></Tag>
      </div>
      <div className="meter"><i style={{ width: `${pct}%` }} /></div>
      <span className="small muted">
        Only the next {s.cfg.visibleDays} days are shown. When they fill up, the next {s.cfg.visibleDays} open automatically.
        {w.exhaustedChunks > 0 && ` (${w.exhaustedChunks} earlier window${w.exhaustedChunks > 1 ? "s" : ""} already full)`}
      </span>
    </div>
  );
}

function PickSlot() {
  const { s, update } = useStore();
  const L = s.lead;
  const [sel, setSel] = useState<string | null>(null);
  const w = bookingWindow(s);
  const notice =
    L.notice === "bail" ? (
      <Notice tone="amber" title="Your interviewer can’t make it — sorry about that">Pick any open slot below. This doesn’t count as a reschedule.</Notice>
    ) : L.notice === "reopened" ? (
      <Notice tone="green" title="Booking reopened by your counsellor">Pick a time that works — there’s no fee.</Notice>
    ) : L.notice === "next_round" ? (
      <Notice tone="green" title={`You’ve been invited to Round ${L.round}`}>Your previous round is complete. Book the next one below.</Notice>
    ) : null;
  if (w.none)
    return (
      <>
        <Intro title={`Schedule your Round ${L.round} interview`} status={`Round ${L.round} of up to ${MAX_ROUNDS}`} tone="gray" />
        {notice}
        <IllusCard name="clock" title="No interview slots are available right now" sub="New times depend on interviewer availability. We’ll email you the moment new slots open — no need to keep checking.">
          <div className="row">
            <Btn onClick={() => update(callback)}><Phone size={16} /> Request a callback</Btn>
          </div>
        </IllusCard>
        <Notice tone="gray" title="What happens next">Your counsellor can see you’re waiting and will reach out if it takes more than a day.</Notice>
        <CtaBar title="No slots right now" sub="We’ll email you when new times open">
          <Btn onClick={() => update(callback)}><Phone size={16} /> Request a callback</Btn>
        </CtaBar>
      </>
    );
  return (
    <>
      <Intro
        title={`Schedule your Round ${L.round} interview`}
        sub="Choose a time that works for you. Interviews are 30 minutes on Google Meet, with a 15-minute buffer."
        status={`Round ${L.round} of up to ${MAX_ROUNDS}`}
        tone="gray"
      />
      {notice}
      <Fomo />
      <Card title="Available slots" sub="All times in IST (UTC+05:30)" right={<Btn kind="ghost" sm onClick={() => update(callback)}>Need help? Request callback</Btn>}>
        <SlotGrid sel={sel} onSel={setSel} />
      </Card>
      <CtaBar title={sel ? `${fmt.longDate(slotById(s, sel)!.start)} · ${fmt.slot(slotById(s, sel)!.start)}` : "Select a slot to continue"} sub={sel ? `Round ${L.round} · 30 min on Google Meet` : `${bookingWindow(s).free} slots open in the next ${s.cfg.visibleDays} days`}>
        <Btn disabled={!sel} onClick={() => update((d) => (d.ui.review = sel))}>Review slot <ArrowRight size={16} /></Btn>
      </CtaBar>
    </>
  );
}

function ReviewSlot() {
  const { s, update } = useStore();
  const slot = slotById(s, s.ui.review)!;
  return (
    <>
      <Intro title="Review your interview slot" sub="Confirm to lock it in. We’ll create your Google Meet and block both calendars." />
      <Card title={`Round ${s.lead.round} · Personal interview`} className="tint">
        <KV
          rows={[
            ["Date", fmt.longDate(slot.start)],
            ["Time", fmt.slot(slot.start)],
            ["Buffer", `${BUFFER_MIN} min after the interview`],
            ["Interviewer", `${slot.iv} · SSB interview panel`],
            ["Where", "Google Meet (link on your dashboard)"],
          ]}
        />
        <Notice tone="gray" title="You can reschedule for free up to 24 hours before">A reason is needed; no repercussions.</Notice>
      </Card>
      <CtaBar title={`${fmt.longDate(slot.start)} · ${fmt.slot(slot.start)}`} sub={`with ${slot.iv}`}>
        <Btn kind="secondary" onClick={() => update((d) => (d.ui.review = null))}>Change slot</Btn>
        <Btn onClick={() => update((d) => book(d, slot.id))}><Check size={16} weight="bold" /> Confirm booking</Btn>
      </CtaBar>
    </>
  );
}

function Confirmed() {
  const { s, update } = useStore();
  const r = currentRound(s)!;
  const h = hoursUntil(s, r.start);
  const canResched = h >= RESCHEDULE_CUTOFF_H;
  const joinOpen = s.now >= r.start - 10 * MIN && s.now <= r.start + INTERVIEW_MIN * MIN;
  const live = s.now >= r.start;
  const open = (title: string, body: string[]) => update((d) => (d.ui.modal = { title, body }));
  return (
    <>
      <Intro title={live ? "Your interview is live" : "Your interview is scheduled"} sub={`You’re all set, ${s.lead.first}. Review the preparation kit before joining the conversation.`} status="Confirmed" />
      {s.lead.reschedules.length > 0 && (
        <Notice tone="green" title="Rescheduled">Your interview moved to {fmt.dt(r.start)}. Your interviewer’s calendar was updated automatically.</Notice>
      )}

      {/* Appointment */}
      <section className="hero">
        <div className="row" style={{ gap: 16, flexWrap: "nowrap" }}>
          <span className="hero-ic"><CalendarCheck size={24} /></span>
          <div>
            <div className="when">{fmt.longDate(r.start)}</div>
            <div style={{ opacity: 0.9 }}>{fmt.slot(r.start)} · 30-min interview + 15-min buffer</div>
          </div>
        </div>
        <div className="grid2" style={{ gap: 12 }}>
          <div><div className="lbl">Interviewer</div>{r.iv} · SSB interview panel</div>
          <div><div className="lbl">Joining as</div>{s.lead.name}</div>
        </div>
        <div>
          <div className="lbl">{live ? "Ends in" : "Time remaining"}</div>
          <div className="big">{live ? <Countdown to={r.start + INTERVIEW_MIN * MIN} /> : <Countdown to={r.start} />}</div>
        </div>
        <div className="row">
          <Btn kind="light" disabled={!joinOpen} onClick={() => open("Opening Google Meet…", [r.meet, "Recording starts automatically; the transcript and summary go to your counsellor’s CRM record."])}>
            <VideoCamera size={16} /> {joinOpen ? "Join interview" : "Join opens 10 min before"}
          </Btn>
          <Btn kind="outline-w" onClick={() => open("Added to calendar", [`SSB Round ${r.n} interview · ${fmt.dt(r.start)} IST`, "Google Calendar invite with the Meet link sent to your email. 15-min buffer held on the interviewer’s calendar."])}>
            <CalendarPlus size={16} /> Add to calendar
          </Btn>
          <button className="btn ghost-w" disabled={!canResched} onClick={() => update((d) => (d.ui.resched = true))}>
            <ArrowsClockwise size={16} /> Request reschedule
          </button>
        </div>
        <div className="note">
          {canResched ? (
            <><b>Note:</b> Rescheduling is free and can be done up to 24 hours before your scheduled start time via this dashboard ({fmt.dur(r.start - RESCHEDULE_CUTOFF_H * 3_600_000 - s.now)} left).</>
          ) : (
            <><b>Rescheduling is closed</b> — it’s less than 24 hours to your interview. If something urgent came up, use “Talk to your counsellor” at the top.</>
          )}
        </div>
      </section>

      {/* Interview prep — proctoring setup */}
      <section className="card">
        <span className="eyebrow">Interview prep</span>
        <div className="prep-row">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <h3>Follow these instructions for a seamless interview experience</h3>
            <p className="muted" style={{ fontSize: 14 }}>Please try out the dual proctoring setup once before the actual interview to avoid any last-minute issues.</p>
            <button className="linkbtn" onClick={() => open("Proctoring setup check", ["Opens the dual-proctoring test: pair your phone camera and share your screen once to confirm everything works."])}>
              Try it out here <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="video" style={{ backgroundImage: `url(${IMG.meeting})` }} onClick={() => open("Personal interview walkthrough", ["YouTube video: how the SSB personal interview works and how to set up proctoring."])} aria-label="Play personal interview walkthrough">
            <span className="video-title">Personal Interview — what to expect</span>
            <YtBadge />
            <span className="video-yt"><YoutubeLogo size={18} weight="fill" /> YouTube</span>
          </button>
        </div>
        <ol className="steps">
          <li><b>Step 1:</b> Click on the Join interview button when it’s live.</li>
          <li><b>Step 2:</b> Set up proctoring by pairing your mobile and sharing your screen as shown.</li>
          <li><b>Step 3:</b> Enter the Scaler platform and click the interview link within the question to proceed to your interview.</li>
        </ol>
      </section>

      {/* Interview practice — AI mock */}
      <section className="card">
        <span className="eyebrow">Interview practice</span>
        <div className="row between">
          <div className="row" style={{ gap: 10 }}>
            <h3>Take AI-led interview</h3>
            <span className="tag t-gray"><Clock size={14} /> 20 min</span>
          </div>
          <Btn kind="secondary" onClick={() => open("AI mock interview", ["Starting a 20-minute mock with the Anshuman-voice AI interviewer.", "You’ll get a scorecard on structure, numbers and communication afterwards."])}>
            <VideoCamera size={16} /> Take mock interview
          </Btn>
        </div>
        <div className="hint"><Sparkle size={18} /> You can attempt the sample interview multiple times to enhance your preparation. Voiced by Anshuman.</div>
      </section>

      {/* Preparation kit */}
      <Card title="Your interview preparation kit" sub="Read the case and watch these resources. Bring your reasoning, not a memorised answer.">
        <div className="row between">
          <div className="row" style={{ gap: 14, flexWrap: "nowrap" }}>
            <span className="ico"><FileText size={20} /></span>
            <div>
              <b>SSB business case study</b>
              <div className="small muted">Preparation document · Cost, GTM &amp; margins</div>
            </div>
          </div>
          <div className="row" style={{ gap: 4 }}>
            <Btn kind="ghost" sm onClick={() => open("SSB business case study", ["Case-study PDF opens in a new tab."])}><Eye size={16} /> View</Btn>
            <Btn kind="ghost" sm aria-label="Download case study" onClick={() => update((d) => (d.ui.toast = "Downloading case study…"))}><DownloadSimple size={16} /></Btn>
          </div>
        </div>
        <div className="divider" />
        <div className="grid2">
          {([
            ["Cost optimisation essentials", "Understand cost drivers and trade-offs · YouTube", IMG.classroom],
            ["Go-to-market & profit margins", "Connect growth decisions with business economics · YouTube", IMG.laptop],
          ] as const).map(([t, d, img]) => (
            <div key={t} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button className="video" style={{ backgroundImage: `url(${img})` }} onClick={() => open(t, ["Opens on YouTube."])} aria-label={`Play ${t}`}>
                <span className="video-title">{t}</span>
                <YtBadge />
                <span className="video-yt"><YoutubeLogo size={18} weight="fill" /> YouTube</span>
              </button>
              <b style={{ fontSize: 14, marginTop: 6 }}>{t}</b>
              <span className="small muted">{d}</span>
              <button className="linkbtn" onClick={() => open(t, ["Opens on YouTube."])}>Watch on YouTube</button>
            </div>
          ))}
        </div>
      </Card>

      <CtaBar title={live ? "Your interview is live" : `Interview in ${fmt.dur(r.start - s.now)}`} sub={`${fmt.dt(r.start)} IST · ${r.iv}`}>
        <Btn kind="secondary" disabled={!canResched} onClick={() => update((d) => (d.ui.resched = true))}><ArrowsClockwise size={16} /> Reschedule</Btn>
        <Btn disabled={!joinOpen} onClick={() => open("Opening Google Meet…", [r.meet])}><VideoCamera size={16} /> {joinOpen ? "Join interview" : "Join opens 10 min before"}</Btn>
      </CtaBar>
    </>
  );
}

function RescheduleForm() {
  const { s, update } = useStore();
  const r = currentRound(s)!;
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [doc, setDoc] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const n = s.lead.reschedules.length + 1;
  const tooLate = hoursUntil(s, r.start) < RESCHEDULE_CUTOFF_H;
  const submit = () => {
    setTried(true);
    if (!reason || !sel || tooLate) return;
    update((d) => reschedule(d, sel, reason, detail, doc));
  };
  return (
    <>
      <Intro title={`Reschedule your Round ${r.n} interview`} sub="Pick a new time. Rescheduling is free — we just need to know why." status={n === 1 ? "First reschedule · free" : `Reschedule #${n} · free`} tone="amber" />
      {tooLate && <Notice tone="red" title="Rescheduling just closed">It’s now less than 24 hours to your interview. Request a callback instead.</Notice>}
      <Card title="Your current appointment">
        <KV rows={[["Date & time", fmt.dt(r.start) + " IST"], ["Interviewer", r.iv], ["Reschedule closes", fmt.dt(r.start - RESCHEDULE_CUTOFF_H * 3_600_000) + " IST"]]} />
      </Card>
      <Card title="Tell us about the change" sub="No repercussions — this only helps us plan interviewer time.">
        <Field label="Reason for rescheduling" req err={tried && !reason && "Please choose a reason to continue."}>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Select a reason</option>
            {RESCHEDULE_REASONS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Anything else? (optional)">
          <textarea rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="e.g. Quarterly review moved to that afternoon" />
        </Field>
        <div className="upload">
          <span>
            <b>Supporting document</b> <span className="muted">(optional · PDF/JPG, max 5 MB)</span>
            {doc && <div className="small row" style={{ color: "var(--gd)", gap: 4 }}><Check size={14} weight="bold" /> meeting-invite.pdf attached</div>}
          </span>
          <Btn kind="secondary" sm onClick={() => setDoc(!doc)}>{doc ? "Remove" : <><UploadSimple size={14} /> Upload</>}</Btn>
        </div>
      </Card>
      <Card title="Select your new slot" sub={`Showing the next ${s.cfg.visibleDays} days with open slots`}>
        <SlotGrid sel={sel} onSel={setSel} excludeId={r.slotId} />
        {tried && !sel && <span className="small" style={{ color: "var(--red)" }}>Choose a new slot.</span>}
      </Card>
      <CtaBar title={sel ? `New time: ${fmt.dt(slotById(s, sel)!.start)} IST` : "Pick a reason and a new slot"} sub="Free · no repercussions">
        <Btn kind="secondary" onClick={() => update((d) => (d.ui.resched = false))}>Keep current slot</Btn>
        <Btn onClick={submit} disabled={tooLate}><ArrowsClockwise size={16} /> Confirm reschedule</Btn>
      </CtaBar>
    </>
  );
}

function AwaitingFeedback() {
  const { s, update } = useStore();
  const r = currentRound(s)!;
  return (
    <>
      <Intro title="Thanks for interviewing with us" sub="Your interviewer is submitting feedback. Results appear here — we’ll email you when there’s an update." status={`Round ${r.n} · Under review`} tone="amber" />
      <IllusCard name="clock" title="Your result is on its way" sub="Most leads hear back within 2 working days.">
        <KV rows={[["Round", `Round ${r.n} · ${fmt.longDate(r.start)}`], ["Interviewer", r.iv], ["Recording", "Processed → transcript + summary"], ["Status", "Awaiting interviewer feedback"]]} />
      </IllusCard>
      <Notice tone="gray" title="What happens next">Most leads hear back within 2 working days. Some candidates are invited to a second conversation — that’s normal.</Notice>
      <CtaBar title="Results usually take 2 working days" sub="Questions in the meantime?">
        <Btn onClick={() => update(callback)}><Phone size={16} /> Talk to your counsellor</Btn>
      </CtaBar>
    </>
  );
}

function RoundDone() {
  const { s, update } = useStore();
  const n = completedRounds(s).length;
  return (
    <>
      <Intro title={`Round ${s.lead.round} complete`} sub="Thanks — your interview feedback is in. The admissions team is reviewing your application." status="Under review" tone="amber" />
      <IllusCard name="clock" title="We’re reviewing your interview" sub="You’ll see the next step here and in your email.">
        <KV rows={[["Rounds completed", String(n)], ["Next", "Another conversation or final review"], ["Your counsellor", s.lead.counsellor.name]]} />
      </IllusCard>
      <CtaBar title="Your interview is under review" sub="Questions in the meantime?">
        <Btn onClick={() => update(callback)}><Phone size={16} /> Talk to your counsellor</Btn>
      </CtaBar>
    </>
  );
}

function NoShow() {
  const { s, update } = useStore();
  const r = [...s.lead.rounds].reverse().find((x) => x.status === "no_show");
  return (
    <>
      <Intro title="We missed you at your interview" sub={r ? `Your Round ${r.n} interview on ${fmt.dt(r.start)} wasn’t attended.` : ""} status="Missed" tone="red" />
      <Notice tone="green" title="No fee — you can still interview">Your counsellor {s.lead.counsellor.name} will reopen booking for you. If you want it sooner, request a callback.</Notice>
      <IllusCard name="broken-link" title="Let’s get you rebooked" sub={`Talk to ${s.lead.counsellor.name} · ${s.lead.counsellor.phone} · WhatsApp available`}>
        <div className="row">
          <Btn onClick={() => update(callback)}><Phone size={16} /> Request callback</Btn>
          <Btn kind="secondary" onClick={() => update(callback)}><WhatsappLogo size={16} /> WhatsApp</Btn>
        </div>
      </IllusCard>
      <CtaBar title="Missed your interview?" sub="No fee — your counsellor will rebook you">
        <Btn onClick={() => update(callback)}><Phone size={16} /> Talk to your counsellor</Btn>
      </CtaBar>
    </>
  );
}

function DecisionPending() {
  const { update } = useStore();
  return (
    <>
      <Intro title="Your application is in final review" sub="All your interview rounds are complete. The admissions committee is making a decision." status="Decision pending" tone="amber" />
      <IllusCard name="clock" tint title="Sit tight — a decision is coming" sub="We’ll update this dashboard and email you as soon as there’s a decision. Most decisions take 2–4 working days." />
      <CtaBar title="Decision in 2–4 working days" sub="Questions in the meantime?">
        <Btn onClick={() => update(callback)}><Phone size={16} /> Talk to your counsellor</Btn>
      </CtaBar>
    </>
  );
}

function Waitlisted() {
  const { s, update } = useStore();
  return (
    <>
      <Intro title={`You’re on our waitlist, ${s.lead.first}`} sub="Your application remains under consideration. We review the waitlist every round." status="Waitlisted" tone="blue" />
      <IllusCard name="clock" title="Your application stays active" sub="You don’t need to reapply. Strengthen your profile — updates are visible to the admissions team and reviewed every round.">
        <div className="row">
          <Btn onClick={() => update((d) => (d.ui.editProfile = true))}><UploadSimple size={16} /> Update your profile</Btn>
          <Btn kind="secondary" onClick={() => update(callback)}><Phone size={16} /> Talk to counsellor</Btn>
        </div>
      </IllusCard>
      {s.lead.profileUpdates.length > 0 && (
        <Card title="Your updates">
          <div className="timeline">
            {s.lead.profileUpdates.map((u, i) => (
              <div className="tl-item" key={i}><span className="when">{fmt.dt(u.at)}</span><span>{u.note}</span></div>
            ))}
          </div>
        </Card>
      )}
      <CtaBar title="Strengthen your application" sub="Updates are reviewed every round">
        <Btn onClick={() => update((d) => (d.ui.editProfile = true))}><UploadSimple size={16} /> Update your profile</Btn>
      </CtaBar>
    </>
  );
}

function ProfileForm() {
  const { update } = useStore();
  const [kind, setKind] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  return (
    <>
      <Intro title="Keep your profile up to date" sub="Share anything new since you applied. The admissions team reviews updates every round." status="Waitlisted" tone="blue" />
      <Card title="Share a profile update">
        <Field label="What changed?" req err={tried && !kind && "Choose what changed."}>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Select</option>
            <option>New role / promotion</option>
            <option>Updated test score</option>
            <option>New achievement / project</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Details" req err={tried && !note && "Add a short description."}>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Promoted to Senior Product Analyst in Nov 2026" />
        </Field>
        <div className="upload"><span>Supporting document <span className="muted">(optional)</span></span><Btn kind="secondary" sm>Upload</Btn></div>
      </Card>
      <CtaBar title="Share your update" sub="Visible to the admissions team">
        <Btn kind="secondary" onClick={() => update((d) => (d.ui.editProfile = false))}>Cancel</Btn>
        <Btn onClick={() => { setTried(true); if (kind && note) update((d) => updateProfile(d, `${kind}: ${note}`)); }}>Save update</Btn>
      </CtaBar>
    </>
  );
}

function Rejected() {
  const { s } = useStore();
  const at = (s.lead.rejectedAt ?? s.now) + COOLDOWN_DAYS * DAY;
  const open = s.now >= at;
  return (
    <>
      <Intro title="An update on your application" sub="Thank you for the time you put into the process." status="Not moving forward" tone="red" />
      <div className="grid2">
        <Card title="We’re unable to move forward this time" sub="This decision reflects this cohort’s process, not your potential." />
        <Card title={open ? "You can apply again" : "You can reapply after the cooldown"} sub={`Reapply opens ${fmt.longDate(at)} · full application fee applies`}>
          <div className="row" style={{ alignItems: "center" }}>
            <Btn disabled={!open}>Start a new application · {fmt.money(2500)}</Btn>
            {!open && <Tag tone="gray"><Clock size={14} /> Opens in <Countdown to={at} /></Tag>}
          </div>
        </Card>
      </div>
      <CtaBar title={open ? "You can apply again" : "Reapply after the cooldown"} sub={`Opens ${fmt.longDate(at)} · full application fee`}>
        {!open && <Tag tone="gray"><Clock size={14} /> Opens in <Countdown to={at} /></Tag>}
        <Btn disabled={!open}>Start a new application</Btn>
      </CtaBar>
    </>
  );
}

// ---------------- Offer ----------------
function OfferPreparing() {
  return (
    <>
      <Intro title="Good news is on the way" sub="You’ve been approved. Your offer letters are being prepared and will appear here and in your email at the same time." status="Approved" />
      <IllusCard name="certificate" tint title="Your offer letters are being prepared" sub="Nothing to do yet — we’ll notify you the moment your offer is live." />
    </>
  );
}

function FeeSummary() {
  const { s } = useStore();
  const sc = scholarship({ ...s, offer: { ...s.offer, final: s.offer.pct } });
  return (
    <KV
      rows={[
        ["Admission fee (same for everyone · due now)", fmt.money(FEES.admission)],
        ["Tuition · Term 1", sc.final ? <span key="t1"><s className="muted" style={{ fontWeight: 400 }}>{fmt.money(FEES.term1)}</s> {fmt.money(sc.term1)}</span> : fmt.money(FEES.term1)],
        ["Tuition · Term 2", sc.final ? <span key="t2"><s className="muted" style={{ fontWeight: 400 }}>{fmt.money(FEES.term2)}</s> {fmt.money(sc.term2)}</span> : fmt.money(FEES.term2)],
        ["Scholarship", sc.final ? `${sc.final}% · −${fmt.money(sc.amt)} (tuition only)` : "—"],
        ["Total programme fee", fmt.money(sc.total), "tot"],
      ]}
    />
  );
}

function letters(d: State) {
  const pct = d.offer.pct ?? 0;
  d.ui.modal = {
    title: `Offer letters · v${d.offer.version}`,
    body: [
      `Provisional admission letter — ${d.lead.name}, SSB PGP 2027. Includes full payment schedule (admission fee ${fmt.money(FEES.admission)}; Term 1 & Term 2 tuition) — valid for bank / education-loan applications.`,
      pct > 0 ? `Scholarship letter — ${pct}% merit scholarship, deducted proportionally from Term 1 and Term 2 tuition.` : "No scholarship letter (not a scholarship holder).",
      "Sent from the official SSB admissions ID. Same documents as your offer email.",
    ],
  };
}

function OfferLive() {
  const { s, update } = useStore();
  const O = s.offer;
  const last = O.revisions[0];
  return (
    <>
      <Intro title={`Congratulations, ${s.lead.first}!`} sub="You’ve been offered provisional admission to Scaler School of Business. Confirm your seat by paying the admission fee." status={O.version > 1 ? `Offer v${O.version} · revised` : "Offer live"} />
      {last && (last.kind === "Revised" || last.kind === "Extended" || last.kind === "Resent") && (
        <Notice tone="blue" title={last.kind === "Revised" ? "Your offer was revised" : last.kind === "Extended" ? "Your deadline was extended" : "Your offer was re-sent"}>{last.note}. The same update is in your email.</Notice>
      )}
      <div className="split">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="hero">
            <div className="lbl">Reserve your seat — offer expires in</div>
            <div className="big"><Countdown to={O.deadline!} /></div>
            <div style={{ opacity: 0.9 }}>Pay by {fmt.dt(O.deadline!)} IST</div>
            <div className="row">
              <Btn kind="light" onClick={() => update((d) => (d.ui.pay = { gw: "PhonePe", phase: "choose" }))}>Pay admission fee · {fmt.money(FEES.admission)}</Btn>
              <Btn kind="outline-w" onClick={() => update(letters)}><FileText size={16} /> View offer letters</Btn>
            </div>
          </section>
          <Card title="Your fee & scholarship summary">
            <FeeSummary />
          </Card>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card title="Offer documents" sub="Also attached to your offer email" right={<img src="/illus/certificate.png" alt="" width={84} height={84} />}>
            <div className="row between"><span>Provisional admission letter</span><Btn kind="ghost" sm onClick={() => update(letters)}>View</Btn></div>
            {(O.pct ?? 0) > 0 && <div className="row between"><span>Scholarship letter ({O.pct}%)</span><Btn kind="ghost" sm onClick={() => update(letters)}>View</Btn></div>}
          </Card>
          <div className="photo" style={{ backgroundImage: `url(${IMG.campus})`, height: 160 }} />

        </div>
      </div>
      <CtaBar title={`Admission fee · ${fmt.money(FEES.admission)}`} sub={<>Offer expires in <Countdown to={O.deadline!} /></>}>
        <Btn kind="secondary" onClick={() => update(letters)}><FileText size={16} /> View letters</Btn>
        <Btn onClick={() => update((d) => (d.ui.pay = { gw: "PhonePe", phase: "choose" }))}><LockKey size={16} /> Pay &amp; reserve seat</Btn>
      </CtaBar>
    </>
  );
}

function Checkout() {
  const { s, update } = useStore();
  const p = s.ui.pay!;
  const [gw, setGw] = useState<"PhonePe" | "Razorpay">(p.gw);
  const [busy, setBusy] = useState(false);
  useEffect(() => setGw(p.gw), [p.gw]);
  const go = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      update((d) => { pay(d, gw); });
    }, 1100);
  };
  const failed = p.phase === "failed";
  return (
    <>
      <Intro title={failed ? "Your payment wasn’t completed" : "Pay admission fee"} sub={failed ? "No money was deducted. Try again with our backup payment partner." : "Secure payment on your dashboard — no external links."} status={failed ? "Payment failed" : `Due ${fmt.date(s.offer.deadline!)}`} tone={failed ? "red" : "amber"} />
      {failed && (
        <IllusCard name="broken-link" size={150} title="PhonePe couldn’t process this payment" sub="We’ve switched you to Razorpay, our backup partner. If any amount was debited, it’ll be auto-refunded in 5–7 days." />
      )}
      <div className="split">
        <Card title="Choose payment method">
          {(["PhonePe", "Razorpay"] as const).map((g) => (
            <label key={g} className="slot" style={{ cursor: "pointer", alignItems: "center", ...(gw === g ? { borderColor: "var(--g)", background: "var(--tint)" } : {}) }}>
              <span className="row" style={{ gap: 10 }}>
                <input type="radio" name="gw" checked={gw === g} onChange={() => setGw(g)} style={{ accentColor: "var(--g)" }} />
                {g} {g === "PhonePe" ? "· UPI, cards, netbanking" : "· backup gateway"}
              </span>
              {g === "PhonePe" ? <Tag tone="green">Primary</Tag> : <Tag tone="gray">Backup</Tag>}
            </label>
          ))}
          {s.cfg.phonepeDown && gw === "PhonePe" && <span className="small muted">Demo: PhonePe outage is ON (Admin → Settings) — this attempt will fail.</span>}
        </Card>
        <Card title="Summary">
          <KV rows={[["Admission fee", fmt.money(FEES.admission)], ["Offer", `v${s.offer.version}`], ["Deadline", fmt.dt(s.offer.deadline!)]]} />
          <span className="small muted">Scholarship never reduces the admission fee.</span>
        </Card>
      </div>
      <CtaBar title={`Admission fee · ${fmt.money(FEES.admission)}`} sub={<>Offer expires in <Countdown to={s.offer.deadline!} /></>}>
        <Btn kind="secondary" onClick={() => update((d) => (d.ui.pay = null))}>Back to offer</Btn>
        <Btn onClick={go} disabled={busy}><LockKey size={16} /> {busy ? "Processing…" : `Pay via ${gw}`}</Btn>
      </CtaBar>
    </>
  );
}

function OfferExpired() {
  const { s, update } = useStore();
  return (
    <>
      <Intro title="Your offer payment window has closed" sub={`The deadline was ${fmt.dt(s.offer.deadline!)} IST.`} status="Expired" tone="red" />
      <IllusCard name="broken-link" title="This offer link has expired — but your seat isn’t gone yet" sub={`Talk to ${s.lead.counsellor.name} — they can resend your offer or extend the deadline. You haven’t been moved to the waitlist.`}>
        <div className="row">
          <Btn onClick={() => update(callback)}><Phone size={16} /> Request callback</Btn>
        </div>
      </IllusCard>
      <CtaBar title="Your seat isn’t gone yet" sub="Your counsellor can resend or extend your offer">
        <Btn onClick={() => update(callback)}><Phone size={16} /> Talk to your counsellor</Btn>
      </CtaBar>
    </>
  );
}

function Onboarding() {
  const { s, update } = useStore();
  const loan = s.ui.onboardingLoan;
  const type = s.ui.onboardingType;
  const [f, setF] = useState({ name: s.lead.name, dob: "", city: "", emergency: "", size: "" });
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const [tried, setTried] = useState(false);
  const reqDocs = loan ? (type === "salaried" ? ["Last 3 salary slips", "Bank statement (6 months)", "Co-applicant KYC"] : ["Business ITR (2 years)", "Bank statement (6 months)", "Co-applicant KYC"]) : [];
  const missing = !f.dob || !f.city || !f.emergency || reqDocs.some((d) => !docs[d]);
  return (
    <>
      <Intro title={`Welcome to SSB, ${s.lead.first}!`} sub="Your seat is confirmed. A note from Shan & Adhiraj — and one short form to get you started." status="Accepted" />
      <div className="photo" style={{ backgroundImage: `url(${IMG.cohort})`, height: 220 }} />
      <Card className="tint" title="From Shan & Adhiraj" sub="“We’re thrilled to have you in the founding cohort. See you on campus.”" />
      <Card title="Your onboarding form" sub="Fields are placeholders until Shan + Adhiraj finalise the list.">
        <div className="grid2">
          <Field label="Full name" req><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Date of birth" req err={tried && !f.dob && "Required"}><input type="date" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} /></Field>
          <Field label="Current city" req err={tried && !f.city && "Required"}><input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></Field>
          <Field label="Emergency contact" req err={tried && !f.emergency && "Required"}><input value={f.emergency} onChange={(e) => setF({ ...f, emergency: e.target.value })} placeholder="Name · phone" /></Field>
        </div>
        <Field label="How are you funding your programme?">
          <div className="seg">
            <button className={!loan ? "on" : ""} onClick={() => update((d) => (d.ui.onboardingLoan = false))}>Self-funded</button>
            <button className={loan ? "on" : ""} onClick={() => update((d) => (d.ui.onboardingLoan = true))}>Education loan</button>
          </div>
        </Field>
        {loan && (
          <div className="card" style={{ background: "var(--soft)" }}>
            <div className="row between">
              <b>Financial documents for your loan</b>
              <div className="seg">
                <button className={type === "salaried" ? "on" : ""} onClick={() => update((d) => (d.ui.onboardingType = "salaried"))}>Salaried</button>
                <button className={type === "family" ? "on" : ""} onClick={() => update((d) => (d.ui.onboardingType = "family"))}>Family business</button>
              </div>
            </div>
            {type === "family" && <Notice tone="amber" title="Family-business applicants">No salary slips or last-organisation fields — business ITR instead. (Open decision: FBM vs main MBA flow.)</Notice>}
            {reqDocs.map((d) => (
              <div className="upload" key={d} style={tried && !docs[d] ? { borderColor: "var(--red)" } : {}}>
                <span>{d} {docs[d] && <span style={{ color: "var(--gd)" }}>· uploaded</span>}</span>
                <Btn kind="secondary" sm onClick={() => setDocs({ ...docs, [d]: !docs[d] })}>{docs[d] ? "Remove" : "Upload"}</Btn>
              </div>
            ))}
            <span className="small muted">Your loan partner and term-1 checklist were triggered when your payment was confirmed.</span>
          </div>
        )}
        {tried && missing && <Notice tone="red" title="A few things are missing">Fill the highlighted fields{loan ? " and upload every document" : ""}.</Notice>}
      </Card>
      <CtaBar title="Onboarding form" sub={loan ? `${reqDocs.filter((d) => docs[d]).length} of ${reqDocs.length} documents uploaded` : "Takes about 3 minutes"}>
        <Btn onClick={() => { setTried(true); if (!missing) update((d) => submitOnboarding(d, loan, type)); }}>Submit onboarding form</Btn>
      </CtaBar>
    </>
  );
}

function OnboardDone() {
  const { s } = useStore();
  const o = s.offer.onboarding!;
  return (
    <>
      <Intro title="You’re all set" sub="Your onboarding form has been submitted and shared with the programme team." status="Onboarding submitted" />
      <IllusCard name="certificate" title="Onboarding submitted" sub="Your programme team will be in touch with next steps.">
        <KV rows={[["Submitted", fmt.dt(o.at)], ["Funding", o.loan ? "Education loan · docs attached" : "Self-funded"], ["Applicant type", o.type === "family" ? "Family business" : "Salaried"], ["Synced to", "CRM lead record"]]} />
      </IllusCard>
    </>
  );
}

// ---------------- Inbox ----------------
function Inbox() {
  const { s, update } = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const e = s.emails.find((x) => x.id === sel) ?? s.emails[0];
  return (
    <>
      <Intro title="Email inbox" sub="Every email is sent at the same moment the dashboard updates (no delta) and points back to the dashboard." />
      <div className="emaillist">
        <div className="lst">
          {s.emails.map((x) => (
            <button key={x.id} className={e?.id === x.id ? "on" : ""} onClick={() => setSel(x.id)}>
              <div className="row between"><b style={{ fontSize: 13 }}>SSB Admissions</b><span className="small muted">{fmt.dt(x.at)}</span></div>
              <div style={{ fontSize: 13 }}>{x.subject}</div>
              {x.tag && <Tag tone="gray">{x.tag}</Tag>}
            </button>
          ))}
        </div>
        {e && (
          <div className="body">
            <span className="small muted">From: SSB Admissions (official SSB ID) · To: {s.lead.name}</span>
            <h3 style={{ fontSize: 20 }}>{e.subject}</h3>
            {e.lines.map((l, i) => (
              <p key={i} style={{ fontSize: 14 }}>{l}</p>
            ))}
            {e.cta && <div><Btn onClick={() => update((d) => (d.ui.leadTab = "dashboard"))}>{e.cta}</Btn></div>}
          </div>
        )}
      </div>
    </>
  );
}
