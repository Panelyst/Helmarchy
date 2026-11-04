# Helmarchy — prototype

Helmarchy is the organization. Hermes is the assistant who sits in the rail and answers you.

A clickable prototype of the AI-organization interface: an isometric floor you walk in,
a persistent executive-assistant rail you can talk to, department rooms with a real org
chart where work arrives as artifacts and decisions arrive as an approval gate, and a
board room where the c-suite argues about those decisions in front of you.

Agents, artifacts and events are mock data in `src/data/org.ts` and `src/data/board.ts`.
The assistant answers from a deterministic router by default and calls a real model — any
OpenAI-compatible provider — only for the sentences the router does not recognise. With no key
set, everything still works, just less wittily. See **The model seam**.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # typecheck + production build
```

## The three decisions baked in

1. **Abstract marks, not portraits.** Every employee is a geometric sigil in its department's
   colour with a status ring. No stock photography anywhere.
2. **Artifacts are polymorphic.** One `Artifact` shape renders as a document, a table, a list
   or a code diff (`src/components/Artifact.tsx`). Marketing's work is documents; Engineering's
   is a diff. Adding a real runtime later means adding an artifact kind, not rebuilding a screen.
3. **The gate is an object, not a signature.** `src/components/Gate.tsx` lists what an action
   authorises — budget, blast radius, agent spend, reversibility — with three exits:
   approve, request changes, escalate to the board room.

## Layout

- `src/lib/iso.ts` — isometric projection. Rooms are world-space squares extruded to a slab,
  drawn with a painter's-algorithm sort; labels are HTML positioned by the same projection.
- `src/components/Floor.tsx` — the floor, room chips, presence dots, team status row.
- `src/components/Rail.tsx` — EA briefing: completed overnight, needs you now, one thing to watch.
- `src/components/DeptRoom.tsx` — roster, activity feed, campaign readiness, artifacts, gate.
- `src/components/BoardRoom.tsx` — the live meeting. Turns reveal one at a time (click, space,
  or Play); each seat's condition appears in the roster only after they have spoken, so the
  room fills with commitments as it goes. Your call turns those conditions into either
  amendments or overruled objections.
- `src/data/board.ts` — seats, agenda beats, the seven turns, the three calls and the resolution
  each one files: decisions, owners, due dates and a recorded dissent.
- `src/lib/voice.ts` — `useVoice`: Web Speech recognition plus `speechSynthesis` replies,
  with per-error messages for blocked mics and blocked frames.
- `src/lib/intents.ts` — `route(text)`, a pure function mapping a sentence to an intent:
  navigate to a room, approve, send back, escalate, read the queue, read the briefing.
  It runs first and always: free, instant, and the only path allowed to move a decision.
- `src/App.tsx` — view state, decision state, toasts, and the `command()` handler that turns
  an intent into both an action and the sentence Hermes says back. Escalating from a
  department gate opens the board room directly; the board's outcome writes back to it.

## The board room in one paragraph

Five seats, one item, twenty minutes. Nadia chairs it, Alex presents the $250,000 launch,
and three executives each raise an objection with a number attached: Daniel's CPA is modelled
at $38 and actually ran $41, Emeka's API holds at 3× baseline but not 5×, Rosa's P2 queue goes
to nine hours on a single blast. Alex concedes three terms. You then choose between approving
as scoped (overrules all three), approving with the amendments (carries the room, launch slips
to 11:30), or holding to Thursday (costs the partner window). Each choice files four actions to
named departments and records the dissent — including the dissenting seat's name.

## Org chart

Departments carry three tiers: `tier: 0` head, `tier: 1` managers, `tier: 2` specialists, with
`reportsTo` recording the edge. Marketing is the worked example — Alex Carter over three managers
(Content, Social, SEO) over four specialists including the Copywriter and the Editor who reviews
her. Rooms whose agents have no `tier` still render as a flat list, so the model is additive.

The chart is a display of accountability, not the execution graph: work fans out from the head to
whoever is needed and comes back to the head to assemble. Depth costs fidelity — every extra hop
re-summarises the task and loses detail — so tiers exist where a domain or a review gate is real,
not as message-passing.

## Voice

The mic in the rail dictates, routes the transcript through `route()`, executes the result and
speaks Hermes' reply. It is a conversation, not a one-shot: after Hermes finishes the mic reopens
so you can answer without touching anything, and tapping the mic while Hermes is talking cuts it
off. Half-duplex on purpose — an open mic would otherwise transcribe the speaker.

Commands: *open marketing*, *back to the floor*, *what needs me*, *approve it*, *send it back*,
*amend it*, *hold it*, *take it to the board*, *brief me*. In the board room, *approve it*,
*amend it* and *hold it* resolve the meeting. Typing does exactly the same thing.

`src/lib/speech.ts` owns all output for the app, so two surfaces cannot talk over each other.
Every agent gets a deterministic `(voice, pitch, rate)` tuple from its id — one voice per seat, so
a five-person meeting is followable. Browser voices are a small OS-dependent pool: the results are
**distinguishable, not characterful**. Casting 25 believable people needs a TTS vendor, which this
prototype deliberately does not call.

Recognition needs Chrome, Edge or Safari over https; if the embedding frame blocks the microphone
the rail says so instead of failing silently.

Browser speech recognition is not private — in Chrome the audio is transcribed by Google. That is
fine for a prototype, but a real deployment needs an on-device model or a server path you control.

## The model seam

Known commands never reach a model. Anything else goes to `POST /api/ea`, which prepends a compact
snapshot of the current state — the queue, every decision, per-department spend and budget, what
ran overnight, the one thing to watch — and asks for a single JSON object: `{kind, target, spoken}`.
The sentence is spoken by the same speech layer as everything else, so typing and talking take an
identical path.

The contract matters more than the model. `kind` may only be `answer`, `status`, `brief` or `go`;
`parseReply` strips anything else server-side, so a paraphrase can never move a gate. Approving,
amending and holding stay with the router and the UI.

Configure it in `.env` — git-ignored, never bundled, since Vite only ships `VITE_` variables:

```
EA_API_KEY=...                              # or OPENROUTER_API_KEY / OPENAI_API_KEY
EA_BASE_URL=https://openrouter.ai/api/v1    # optional, this is the default
EA_MODEL=openai/gpt-4o-mini                 # optional
```

Any OpenAI-compatible endpoint works, so Claude, GPT and a cheap OpenRouter model are a base-URL
and model-id swap. With no key the route answers 503, the client returns `null`, and `App.tsx`
falls back to the router's plain reply — no spinner, no silence.

The middleware is in `vite.config.ts`, the handler in `server/ea.ts`. That is a dev-server seam:
a real deployment needs the same `handleEa` behind a Worker route, because a static bundle has
nowhere to keep a key.

## What is deliberately not built

The replay scrubber, the Knowledge section, wake-word/listen-always voice, and any live agent
runtime. Nav items outside Home report that they are not in the prototype.
