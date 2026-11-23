# Euromunplatform: Vision & Structure

> Status: **Draft v0.2**. This is a working document. Change it as decisions get made.

## 1. Vision

**Euromunplatform is one place where the whole EUROMUN conference happens, from a school's first application to the final vote on a resolution.**

Today a MUN conference usually runs on a patchwork of Google Forms, spreadsheets, email threads, group chats and paper notes. Euromunplatform replaces that with one web app that:

- lets **schools and delegates** apply, get their country and committee, and prepare in one place,
- gives **chairs** digital tools that run committee sessions smoothly and fairly under BERMUN procedure,
- lets **delegates** take part in sessions from their own devices (requesting the floor, raising points and motions, voting, writing resolutions, passing notes),
- gives the **secretariat** a clear overview and control of the whole conference.

### Success looks like

- No spreadsheets needed to run registration and allocation.
- Every committee session runs entirely on the platform (debate, amendments, votes, documents).
- A new secretariat team can run the next edition without the original developer.

## 2. Guiding principles

1. **Simple over clever.** It's built and maintained by one person, so we choose boring, well-supported tech and avoid custom infrastructure.
2. **Real-time where it matters.** Live session state (who has the floor, votes, timers) has to sync to every screen in about a second.
3. **Works on a phone.** Delegates will use phones or laptops on conference Wi-Fi. Mobile-first, lightweight pages.
4. **Multi-edition from day one.** Every record belongs to a conference *edition* (e.g. EUROMUN 2027), so the platform can be reused every year.
5. **Roles drive everything.** What you see and can do depends on your role in that edition.
6. **Procedure as configuration.** BERMUN rules are the default, but debate times, majorities and allowed motions are settings, not hard-coded.
7. **The chair can always override.** If a delegate's device fails, the chair can act on their behalf (e.g. record their vote). The session must never get stuck because of one device.

## 3. Users & roles

| Role | Who | Core needs |
|---|---|---|
| **Secretariat / Admin** | Organizing team | Set up the edition, committees and countries; review applications; allocate by hand; publish schedule and announcements; oversee all committees |
| **Faculty advisor** | Teacher or school contact | Register the school, submit the delegation (students + preferences), see their students' allocations and documents |
| **Chair / Dais** | Committee chairs and co-chairs | Run sessions under BERMUN procedure: roll call, recognising speakers, debate times, points, motions, amendments, voting; approve resolutions |
| **Delegate** | Student participant | Profile, see allocation and committee info, submit position paper, co-write resolutions, join the live session, vote, pass notes |
| **Public visitor** | Anyone | Conference info, committees and topics, schedule, how to apply |

A user can hold different roles in different editions (e.g. delegate in 2027, chair in 2028).

## 4. Conference lifecycle

The platform follows the conference timeline. Each phase unlocks different features.

```
 SETUP ──► REGISTRATION ──► ALLOCATION ──► PREPARATION ──► CONFERENCE ──► WRAP-UP
 Admin      Schools &        Secretariat     Position         Lobbying,     Archive,
 creates    individuals      assigns         papers,          debate,       certificates,
 edition,   apply with       countries &     study guides,    amendments,   feedback
 committees preferences      committees      draft resos      voting
                             (by hand)
```

## 5. Modules (MVP)

### 5.1 Public site & info
- Landing page, about, committees and topics, schedule, FAQ, contact
- Downloadable study guides per committee
- "Apply now" call to action while registration is open

### 5.2 Accounts & profiles
- Email sign-up / magic link (Supabase Auth)
- Profile: name, school, age, MUN experience, dietary/accessibility notes
- Role assignment per edition, done by the secretariat

### 5.3 Registration & allocation
- **School delegation application:** advisor registers the school and adds students
- **Individual application:** delegate applies without a school
- Committee and country preferences (ranked, as input for the secretariat)
- Secretariat review dashboard: accept / waitlist / reject
- **Manual allocation board:** secretariat assigns delegate → committee + country by hand, with a view of preferences next to each name and warnings for conflicts (country already taken in that committee, delegate assigned twice)
- Notification email when the allocation is published

### 5.4 Documents (BERMUN resolution workflow)
- **Position papers:** delegate uploads before the deadline; chair reviews and gives feedback
- **Draft resolutions:** written during lobbying in a collaborative editor, with a *main submitter* and co-submitters; preambulatory and operative clauses as structured blocks
- **Approval:** submitted to the chair (and approval panel, if used) for format checks, then given a number and put on the agenda
- **Amendments:** first- and second-degree amendments, each targeting a specific clause (add, strike, change), submitted digitally to the chair
- Status workflow: `draft → submitted → approved → in debate → passed / failed`
- Versions kept for the archive; passed resolutions published with the clauses as amended

### 5.5 Live committee session (fully interactive, BERMUN procedure)

> **To confirm:** the items below follow THIMUN-style procedure, which BERMUN uses. Each point needs checking against the official BERMUN rules of procedure before we build it.

- **Roll call:** delegates mark themselves present from their device; chair confirms; quorum shown live. Chair can mark a country present manually.
- **Debate on a resolution:**
  - Main submitter is given the floor and reads the operative clauses
  - Chair sets the debate time, either **open debate** or **closed debate** (time *in favour* and time *against*), and the timer shows on every screen
  - Delegates **request the floor** from their device; the chair sees a queue and recognises speakers
  - **Yields:** to the chair, or to another delegate (no yields after a yield)
  - **Points of information** to the speaker: delegates request to ask one; the chair sets how many are allowed and selects who asks
- **Points:** point of personal privilege, point of order, point of parliamentary inquiry, point of information to the chair. They are sent digitally and shown to the dais with a priority marker, and the chair resolves them.
- **Motions:** e.g. motion to move to the previous question (go to voting), extend debate time, table the resolution, adjourn. Delegates submit; the chair decides whether it is in order, asks for seconds or objections, and puts it to a vote where needed.
- **Amendment debate:** same flow as above, scoped to one amendment, with its own debate time
- **Voting:**
  - Delegates vote *for / against / abstain* on their device (abstention allowed only where the rules permit it, e.g. not on amendments)
  - Live tally on the chair's screen, revealed to the room when the chair closes the vote
  - Majority rules taken from the committee config (simple majority by default)
  - Optional **roll-call vote**, with countries called in order
  - **Chair proxy vote:** the chair can record a vote for any country that cannot vote on its own device. It is marked as *entered by chair* in the log.
- **Note passing:** delegate-to-delegate messages, optionally screened by the dais
- **Session log:** every action is recorded with a timestamp for the record and the minutes

### 5.6 Communication
- Announcements from the secretariat (whole conference or per committee)
- Conference schedule with the current session highlighted
- In-app notifications (email for important ones)

### 5.7 Admin console
- Edition setup: dates, phases, committees, topics, country matrix, procedure settings per committee
- User and role management
- Overview dashboard: registrations, allocations, document submissions, live committee status
- CSV export of everything

## 6. Later (post-MVP)
- Certificates and awards (Best Delegate etc.) generated as PDFs
- Feedback surveys
- Analytics across editions
- Approval panel workflow for resolutions, if EUROMUN uses one

## 7. Explicitly out of scope
- Payments and fee handling (no fees)
- Non-UN committee formats (crisis, EU institutions, press corps)
- Automatic allocation (allocation is done by hand)
- Multilingual UI (English only)
- Native mobile apps (a responsive web app / PWA is enough)
- Video conferencing (sessions are in person)

## 8. Technical architecture

| Layer | Choice | Why |
|---|---|---|
| Frontend + server | **Next.js** (App Router, TypeScript) | One codebase for public site, dashboards and live views |
| Hosting | **Cloudflare Workers** via the OpenNext Cloudflare adapter (`@opennextjs/cloudflare`) | Cheap or free at this scale, global, easy preview deploys for the prototype |
| Database | **Supabase Postgres** | Relational data fits the domain; Row Level Security enforces roles in the database |
| Auth | **Supabase Auth** | Email/magic link, sessions, linked to role tables |
| Realtime | **Supabase Realtime** (Postgres changes + broadcast + presence) | Floor requests, votes, timers, roll call |
| File storage | **Supabase Storage** | Position papers, study guides |
| UI | Tailwind CSS + shadcn/ui | Fast, accessible, consistent |
| Email | Resend (or similar) | Allocation and deadline notifications |

**Scale target:** fewer than 200 delegates, about 5–10 UN-style committees with about 20–30 people each live at the same time. This is comfortably within Supabase and Cloudflare free/low tiers.

**Realtime design note:** the chair's device is the *authority*. Delegate actions (request the floor, raise a point, submit a motion, cast a vote) are written as rows; chair actions change the session state; every client subscribes to its committee's channel. Timers are synced by storing `started_at` and duration, not by streaming ticks.

### Core data model (first sketch)

```
editions            (id, name, year, phase, dates)
profiles            (id → auth.users, name, school_id, ...)
schools             (id, name, country, advisor_id)
edition_roles       (user_id, edition_id, role)            -- admin | advisor | chair | delegate
committees          (id, edition_id, name, topics, procedure_config)
countries           (id, committee_id, name, flag)          -- country matrix per committee
applications        (id, edition_id, user_id|school_id, preferences, status)
allocations         (id, delegate_id, committee_id, country_id, assigned_by)

sessions            (id, committee_id, starts_at, status, current_mode)
roll_calls          (session_id, country_id, status, marked_by)
debates             (id, session_id, subject_type, subject_id, mode, time_for, time_against, status)
floor_requests      (id, debate_id, country_id, kind, status)   -- speech | POI | point | right_of_reply
motions             (id, session_id, type, proposer_country_id, params, status)
votes               (id, session_id, subject_type, subject_id, majority_rule, abstain_allowed, roll_call, status)
ballots             (vote_id, country_id, choice, cast_by_user_id, entered_by_chair)
notes               (id, session_id, from_country_id, to_country_id, body, screened)
session_events      (id, session_id, type, payload, actor_id, created_at)   -- audit log

documents           (id, committee_id, type, number, title, status, main_submitter_country_id)
document_clauses    (id, document_id, kind, position, content)               -- preambulatory | operative
document_versions   (document_id, snapshot, created_at)
document_submitters (document_id, country_id, kind)                           -- main | co
amendments          (id, document_id, clause_id, parent_amendment_id, action, content, status)

announcements       (id, edition_id, committee_id?, title, body)
schedule_items      (id, edition_id, title, starts_at, ends_at, location)
```

## 9. Roadmap (phased, no fixed deadline)

| Phase | Goal | Contents |
|---|---|---|
| **0. Foundations** | Skeleton deployed on Cloudflare | Repo, Next.js + Supabase setup, auth, roles, edition model, CI, deploy pipeline |
| **1. Public site + registration** | Schools can apply | Public pages, applications, secretariat review |
| **2. Allocation + preparation** | Delegates know their country | Manual allocation board, committee pages, position paper upload, announcements |
| **3. Live session prototype** | Run one mock committee | Roll call, floor requests, debate timers, points, motions, voting with chair proxy, notes |
| **4. Resolutions in session** | Full BERMUN resolution workflow | Collaborative drafting, submitters, approval, amendments (1st/2nd degree), voting on resolutions |
| **5. Polish & dry run** | Ready for real use | Mock conference test with real people, performance on conference Wi-Fi, admin docs |
| **6. Post-MVP** | Nice-to-haves | Certificates, awards, feedback, analytics |

Phase 3 is the riskiest and most distinctive part, so an early throwaway prototype of the live session is worth considering even before phase 1 is finished.

## 10. Decisions log

| Decision | Choice |
|---|---|
| Product name / branding | Euromunplatform |
| Rules of procedure | BERMUN (THIMUN-style) |
| Committee types | UN-style only |
| Allocation | Manual, by the secretariat |
| Devices | Every delegate has a phone or laptop with Wi-Fi; chair can vote on behalf of a country |
| Language | English only |
| Payments | None |
| Region | Not used in the EU |
| Stack | Next.js + Supabase, prototype on Cloudflare Workers |

## 11. Open questions

1. **BERMUN rulebook:** get the official BERMUN rules of procedure document and check section 5.5 against it: the exact list of points and motions, when abstentions are allowed, and the majorities.
2. **Approval panel:** do resolutions go through a separate approval panel, or only the chair?
3. **Data protection:** delegates are likely minors. What does the local law require (consent, data retention)? Until we know, collect only the data we need.
4. **Note screening:** should chairs read notes before delivery, or only on request?
5. **Visual identity:** logo and colours for Euromunplatform, and a domain name.
