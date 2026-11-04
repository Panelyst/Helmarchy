import type { DeptId, MarkKey } from './org'

export type Stance = 'chair' | 'support' | 'concern' | 'opposed'
export type BoardOutcome = 'as-scoped' | 'amended' | 'held'

export interface Seat {
  id: string
  name: string
  role: string
  dept: DeptId
  color: string
  mark: MarkKey
  stance: Stance
  /** what they will not sign without — revealed once they have spoken */
  condition?: string
}

export interface Beat {
  id: string
  title: string
  meta: string
}

export interface Turn {
  seat: string
  beat: string
  text: string
  flag?: { label: string; detail: string }
}

export interface Option {
  id: BoardOutcome
  title: string
  body: string
  cost: string
  satisfies: string[]
}

export interface Resolution {
  summary: string
  decisions: string[]
  actions: { what: string; owner: string; due: string }[]
  dissent: string
}

export const SEATS: Seat[] = [
  { id: 'nadia', name: 'Nadia Okafor', role: 'Chief of Staff · chair', dept: 'board', color: '#9a8cff', mark: 'arc', stance: 'chair' },
  { id: 'alex', name: 'Alex Carter', role: 'Head of Marketing', dept: 'marketing', color: '#4c8dff', mark: 'bolt', stance: 'support', condition: 'No conditions — wants the plan as written' },
  { id: 'daniel', name: 'Daniel Meyer', role: 'CFO', dept: 'finance', color: '#e0b45a', mark: 'square', stance: 'concern', condition: 'Cap at $42, and it goes in writing' },
  { id: 'emeka', name: 'Emeka Nwosu', role: 'CTO', dept: 'engineering', color: '#93a7c4', mark: 'hex', stance: 'concern', condition: 'A throttle and one extra on-call' },
  { id: 'rosa', name: 'Rosa Delgado', role: 'COO', dept: 'operations', color: '#3fcb9b', mark: 'arc', stance: 'concern', condition: 'Email goes out in three waves' },
]

export const BEATS: Beat[] = [
  { id: 'frame', title: 'The ask', meta: 'Nadia · 2 min' },
  { id: 'risk', title: 'What could go wrong', meta: 'Daniel · Emeka · Rosa · 12 min' },
  { id: 'concede', title: 'Terms', meta: 'Alex · 4 min' },
  { id: 'call', title: 'Your call', meta: 'You · 2 min' },
]

export const TURNS: Turn[] = [
  {
    seat: 'nadia',
    beat: 'frame',
    text: 'One item. Marketing wants $250,000 and six weeks, starting at ten. Daniel has the number, Emeka has a capacity question, Rosa has the queue. We finish by 09:55 so Alex can still make the flight.',
  },
  {
    seat: 'alex',
    beat: 'frame',
    text: 'Positioning is settled — the end of release anxiety, not automation. Four segments, 12,400 contacts, 68 assets, five channels. Stop-loss at $45. I am asking for the budget, not for permission to be careful.',
  },
  {
    seat: 'daniel',
    beat: 'risk',
    text: 'The plan is costed at $38 CPA. October ran $41 and nobody adjusted the model. There is $18,000 of headroom in the Q4 envelope — at $45 you spend all of it and the plan still clears, but at $48 it does not. I am not against the spend. I am against the assumption.',
    flag: { label: 'CPA assumption', detail: '$38 modelled · $41 actual · $18,000 headroom' },
  },
  {
    seat: 'emeka',
    beat: 'risk',
    text: 'Forty-eight hours of launch traffic is roughly three times baseline signups. We hold at three. At five the queue backs up and p95 goes from 142ms to a number I will not put in writing. I want a throttle and one extra on-call, and I want them before the email lands, not after.',
    flag: { label: 'Capacity', detail: 'Holds at 3× baseline · 5× degrades p95 past 142ms' },
  },
  {
    seat: 'rosa',
    beat: 'risk',
    text: '12,400 contacts is one blast, and one blast means P2 tickets at nine hours by lunchtime. Three waves and support absorbs it. One wave and you will be reading about our response times in someone else\u2019s newsletter.',
    flag: { label: 'Blast radius', detail: '12,400 contacts · P2 wait 2h at 3 waves, 9h at 1' },
  },
  {
    seat: 'alex',
    beat: 'concede',
    text: 'Fine. Three waves, cap at $42 instead of $45, and I hold the partner flight to week three so the paid social number has room to be wrong. That costs me two weeks of partner revenue and about $12,000 of reach, and I would rather lose that than the launch.',
  },
  {
    seat: 'nadia',
    beat: 'call',
    text: 'Then this is not approve or reject. It is how much of the plan you approve today, and what the rest of us are held to afterwards. James — the room is yours.',
  },
]

export const OPTIONS: Option[] = [
  {
    id: 'as-scoped',
    title: 'Approve as scoped',
    body: 'The full $250,000 at 10:00, stop-loss at $45. Alex ships exactly the plan he walked in with.',
    cost: 'Fastest. Three objections stay open and the engineers find out about the spike on day one.',
    satisfies: [],
  },
  {
    id: 'amended',
    title: 'Approve with the three amendments',
    body: '$250,000, but the CPA cap comes down to $42, email goes in three waves, and the partner flight waits for week three.',
    cost: 'Launch at 11:30. About $12,000 of reach deferred two weeks.',
    satisfies: ['daniel', 'emeka', 'rosa'],
  },
  {
    id: 'held',
    title: 'Hold until Thursday',
    body: 'Nothing spends today. Emeka closes the capacity work, Rosa staffs for the wave, Daniel re-costs at $41.',
    cost: 'Five days of delay, and the partner window closes Friday — week three becomes week five.',
    satisfies: ['daniel', 'emeka'],
  },
]

export const RESOLUTIONS: Record<BoardOutcome, Resolution> = {
  'as-scoped': {
    summary: 'Approved as scoped at 09:51. Launch proceeds today at 10:00.',
    decisions: [
      'Launch proceeds today, 10:00, at $250,000',
      'Stop-loss stays at $45 CPA',
      'Partner flight stays in week one',
      'No amendments to the media plan',
    ],
    actions: [
      { what: 'Start the flight, report spend at 18:00', owner: 'Marketing', due: 'today 18:00' },
      { what: 'Watch p95 through the first 48 hours', owner: 'Engineering', due: '48h' },
      { what: 'Staff P2 for a single-wave blast', owner: 'Operations', due: 'today 10:00' },
      { what: 'Model the $48 CPA case', owner: 'Finance', due: 'Thu' },
    ],
    dissent:
      'Daniel Meyer, Emeka Nwosu and Rosa Delgado asked for amendments and were overruled. Both objections are recorded against this decision.',
  },
  amended: {
    summary: 'Approved with amendments at 09:51. Launch moves to 11:30.',
    decisions: [
      '$250,000 approved, launch 11:30',
      'CPA capped at $42 — stop-loss lowered from $45',
      'Email sent in three waves across six hours',
      'Partner flight deferred to week three',
    ],
    actions: [
      { what: 'Re-cut the media plan to a $42 cap', owner: 'Marketing', due: 'today 11:00' },
      { what: 'Add the throttle and one on-call for 48h', owner: 'Engineering', due: 'today 11:30' },
      { what: 'Split the send into three waves', owner: 'Operations', due: 'today 11:30' },
      { what: 'Hold the partner flight slot for week three', owner: 'Marketing', due: 'Mon' },
    ],
    dissent: 'Nobody dissented. Daniel Meyer asked for the $42 cap in writing, and it is.',
  },
  held: {
    summary: 'Held to Thursday at 09:51. No spend today.',
    decisions: [
      'No spend today — launch deferred to Thursday',
      'Daniel re-costs the plan at $41 actual CPA',
      'Emeka closes the capacity work before the flight',
      'Rosa staffs P2 for the wave ahead of time',
    ],
    actions: [
      { what: 'Re-cost the plan at $41 and resubmit', owner: 'Finance', due: 'Wed' },
      { what: 'Ship the throttle and queue changes', owner: 'Engineering', due: 'Wed' },
      { what: 'Rebuild the send schedule as three waves', owner: 'Operations', due: 'Wed' },
      { what: 'Reprice the partner flight for week five', owner: 'Marketing', due: 'Thu' },
    ],
    dissent:
      'Alex Carter objected. The delay costs the partner window and pushes partner revenue into the next quarter.',
  },
}

export const NUMBERS: { k: string; v: string; tone?: 'warn' | 'good' }[] = [
  { k: 'Budget', v: '$250,000 over 6 weeks' },
  { k: 'Modelled CPA', v: '$38' },
  { k: 'October actual', v: '$41', tone: 'warn' },
  { k: 'Stop-loss', v: '$45' },
  { k: 'Q4 headroom', v: '$18,000' },
  { k: 'Blast radius', v: '12,400 contacts' },
  { k: 'Peak load', v: '3× baseline · 5× unproven', tone: 'warn' },
]
