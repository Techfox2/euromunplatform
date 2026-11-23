# EUROMUN Platform: Vision & Structure

> Status: **Draft v0.1**. This is a working document. Change it as decisions get made.

## 1. Vision

**One place where the whole EUROMUN conference happens, from a school's first application to the final vote on a resolution.**

Today a MUN conference usually runs on a patchwork of Google Forms, spreadsheets, email threads, WhatsApp groups and paper notes. The EUROMUN Platform replaces that with one web app that:

- lets **schools and delegates** apply, get their country and committee, and prepare in one place,
- gives **chairs** digital tools that run committee sessions smoothly and fairly,
- lets **delegates** take part in sessions from their own devices (requesting to speak, voting, writing documents, passing notes),
- gives the **secretariat** a clear overview and control of the whole conference.

### Success looks like

- No spreadsheets needed to run registration and allocation.
- Every committee session runs entirely on the platform (speakers list, motions, votes, documents).
- A new secretariat team can run the next edition without the original developer.

## 2. Guiding principles

1. **Simple over clever.** It's built and maintained by one person, so we choose boring, well-supported tech and avoid custom infrastructure.
2. **Real-time where it matters.** Live session state (speakers list, votes, timers) has to sync to every screen in about a second.
3. **Works on a phone.** Delegates will mostly use phones or laptops on conference Wi-Fi. Mobile-first, lightweight pages.
4. **Multi-edition from day one.** Every record belongs to a conference *edition* (e.g. EUROMUN 2027), so the platform can be reused every year.
5. **Roles drive everything.** What you see and can do depends on your role in that edition.
6. **Rules of procedure as configuration.** Motion types, majorities and speaking times are settings, not hard-coded.

## 3. Users & roles

| Role | Who | Core needs |
|---|---|---|
| **Secretariat / Admin** | Organizing team | Set up the edition and its committees and countries, review applications, allocate, publish schedule and announcements, oversee all committees |
| **Faculty advisor** | Teacher or school contact | Register the school, submit the delegation (students + preferences), see their students' allocations and documents |
| **Chair / Dais** | Committee chairs, co-chairs, rapporteurs | Run sessions: roll call, speakers list, motions, voting, timers; review and approve documents |
| **Delegate** | Student participant | Profile, see allocation and committee info, submit position paper, join live session, co-write resolutions, vote, pass notes |
| **Public visitor** | Anyone | Conference info, committees and topics, schedule, how to apply |

A user can hold different roles in different editions (e.g. delegate in 2027, chair in 2028).

## 4. Conference lifecycle

The platform follows the conference timeline. Each phase unlocks different features.

```
 SETUP ──► REGISTRATION ──► ALLOCATION ──► PREPARATION ──► CONFERENCE ──► WRAP-UP
 Admin      Schools &        Secretariat     Position         Live          Archive,
 creates    individuals      assigns         papers,          sessions,     certificates,
 edition,   apply with       countries &     study guides,    resolutions,  feedback
 committees preferences      committees      briefings        voting
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
- Committee and country preferences (ranked)
- Secretariat review dashboard: accept / waitlist / reject
- **Allocation board:** assign delegate → committee + country, with conflict checks (country already taken, delegation size)
- Notification email when the allocation is published

### 5.4 Documents
- **Position papers:** delegate uploads before the deadline; chair reviews and gives feedback
- **Working papers → draft resolutions:** collaborative editor, sponsors and signatories, submitted to the chair
- **Amendments:** friendly or unfriendly, linked to clauses of a draft resolution
- Status workflow: `draft → submitted → approved → introduced → passed / failed`
- Versions kept for the archive

### 5.5 Live committee session (fully interactive)
- **Roll call:** delegates mark *present* or *present and voting*; chair confirms; quorum shown live
- **Speakers list:** delegates request to be added; chair orders and runs it; speaking timer shown on every screen
- **Motions & points:** delegates submit motions (moderated or unmoderated caucus, close debate, etc.) from their device; chair recognises, orders by disruptiveness, puts them to a vote
- **Voting:** procedural and substantive votes, with live tally, majority rules taken from the config, roll-call voting option
- **Yields & timers:** configurable speaking time; yield to chair, questions or another delegate
- **Note passing:** delegate-to-delegate messages, optionally screened by the dais
- **Session log:** everything is recorded with a timestamp for the record and the minutes

### 5.6 Communication
- Announcements from the secretariat (whole conference or per committee)
- Conference schedule with the current session highlighted
- In-app notifications (email for important ones)

### 5.7 Admin console
- Edition setup: dates, phases, committees, topics, country matrix
- User and role management
- Overview dashboard: registrations, allocations, document submissions, live committee status
- CSV export of everything

## 6. Later (post-MVP)
- Certificates and awards (Best Delegate etc.) generated as PDFs
- Feedback surveys
- Crisis committee tools (directives, crisis updates)
- Press corps module
- Payments (currently **out of scope**: no fees)
- Analytics across editions

## 7. Explicitly out of scope
- Payments and fee handling
- Native mobile apps (a responsive web app / PWA is enough)
- Video conferencing (sessions are in person)

## 8. Technical architecture

| Layer | Choice | Why |
|---|---|---|
| Frontend + server | **Next.js** (App Router, TypeScript) | One codebase for public site, dashboards and live views |
| Hosting | **Cloudflare Workers** via the OpenNext Cloudflare adapter (`@opennextjs/cloudflare`) | Cheap or free at this scale, global, easy preview deploys for the prototype |
| Database | **Supabase Postgres** | Relational data fits the domain; Row Level Security enforces roles in the database |
| Auth | **Supabase Auth** | Email/magic link, sessions, linked to role tables |
| Realtime | **Supabase Realtime** (Postgres changes + broadcast + presence) | Live speakers list, votes, timers, roll call |
| File storage | **Supabase Storage** | Position papers, study guides (Cloudinary only if image-heavy needs appear) |
| UI | Tailwind CSS + shadcn/ui | Fast, accessible, consistent |
| Email | Resend (or similar) | Allocation and deadline notifications |

**Scale target:** fewer than 200 delegates, about 5–10 committees with about 20–30 people each live at the same time. This is comfortably within Supabase and Cloudflare free/low tiers.

**Realtime design note:** the chair's device is the *authority*. Delegate actions (request to speak, submit motion, cast vote) are written as rows; chair actions change the session state; every client subscribes to its committee's channel. Timers are synced by storing `started_at` and duration, not by streaming ticks.

### Core data model (first sketch)

```
editions            (id, name, year, phase, dates)
profiles            (id → auth.users, name, school_id, ...)
schools             (id, name, country, advisor_id)
edition_roles       (user_id, edition_id, role)            -- admin | advisor | chair | delegate
committees          (id, edition_id, name, topics, rules_config)
countries           (id, committee_id, name, flag)          -- country matrix per committee
applications        (id, edition_id, user_id|school_id, preferences, status)
allocations         (id, delegate_id, committee_id, country_id)

sessions            (id, committee_id, starts_at, status, current_mode)
roll_calls          (session_id, country_id, status)
speakers_entries    (id, session_id, country_id, position, status, spoke_at)
motions             (id, session_id, type, proposer_country_id, params, status)
votes               (id, session_id, subject_type, subject_id, majority_rule, status)
ballots             (vote_id, country_id, choice)
notes               (id, session_id, from_country_id, to_country_id, body, screened)
session_events      (id, session_id, type, payload, created_at)   -- audit log

documents           (id, committee_id, type, title, status, author_id)
document_versions   (document_id, content, created_at)
document_sponsors   (document_id, country_id, kind)               -- sponsor | signatory
amendments          (id, document_id, clause_ref, kind, content, status)

announcements       (id, edition_id, committee_id?, title, body)
schedule_items      (id, edition_id, title, starts_at, ends_at, location)
```

## 9. Roadmap (phased, no fixed deadline)

| Phase | Goal | Contents |
|---|---|---|
| **0. Foundations** | Skeleton deployed on Cloudflare | Repo, Next.js + Supabase setup, auth, roles, edition model, CI, deploy pipeline |
| **1. Public site + registration** | Schools can apply | Public pages, applications, secretariat review |
| **2. Allocation + preparation** | Delegates know their country | Allocation board, committee pages, position paper upload, announcements |
| **3. Live session prototype** | Run one mock committee | Roll call, speakers list, timers, motions, voting, notes |
| **4. Documents in session** | Full resolution workflow | Collaborative drafting, sponsors, amendments, voting on resolutions |
| **5. Polish & dry run** | Ready for real use | Mock conference test with real people, performance on conference Wi-Fi, admin docs |
| **6. Post-MVP** | Nice-to-haves | Certificates, awards, feedback, crisis and press modules |

Phase 3 is the riskiest and most distinctive part, so an early throwaway prototype of the live session is worth considering even before phase 1 is finished.

## 10. Open questions

1. **Rules of procedure:** which RoP does EUROMUN use? We need the exact motion list, majorities and the order of disruptiveness.
2. **Committees:** are any of them crisis, double-delegation, or non-UN-style (e.g. EU Council or European Parliament simulations, where voting works differently)?
3. **Language:** English only, or multilingual UI?
4. **Devices:** can we assume every delegate has a phone or laptop in session? What's the backup if Wi-Fi fails?
5. **Data protection:** delegates may be minors in the EU, so GDPR consent, parental consent and data retention policy are needed.
6. **Branding:** existing EUROMUN logo, colours and domain?
7. **Allocation:** manual only, or should the platform suggest allocations from preferences?
8. **Note screening:** should chairs read notes before delivery, or only on request?
