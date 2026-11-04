export type Status = 'working' | 'idle' | 'blocked' | 'waiting'
export type MarkKey = 'hex' | 'tri' | 'dia' | 'orb' | 'arc' | 'bolt' | 'star' | 'ring' | 'square' | 'wave'
export type DeptId = 'board' | 'research' | 'marketing' | 'engineering' | 'operations' | 'data' | 'people' | 'finance'
export type ArtifactKind = 'doc' | 'table' | 'list' | 'diff'

export interface Agent {
  id: string
  name: string
  role: string
  mark: MarkKey
  status: Status
  doing: string
  load: number
  isHead?: boolean
  /** org-chart position — rooms without tiers render as a flat list */
  tier?: 0 | 1 | 2
  reportsTo?: string
}

export interface Artifact {
  id: string
  kind: ArtifactKind
  title: string
  meta: string
  body?: string[]
  columns?: string[]
  rows?: string[][]
  items?: { label: string; sub?: string }[]
  diff?: { sign: '+' | '-' | ' '; text: string }[]
}

export interface GateRow {
  k: string
  v: string
  tone?: 'warn' | 'good'
}

export interface Dept {
  id: DeptId
  name: string
  short: string
  mandate: string
  color: string
  mark: MarkKey
  grid: [number, number]
  height: number
  spend: string
  budget: string
  brief: string
  agents: Agent[]
  artifacts: Artifact[]
  readiness?: { label: string; done: boolean }[]
  feed: { time: string; text: string; tone: 'work' | 'done' | 'wait' }[]
  campaign?: { name: string; stepper: string[]; current: number }
  gate?: { title: string; rows: GateRow[] }
}

export const DEPTS: Dept[] = [
  {
    id: 'board',
    name: 'Executive Suite',
    short: 'Board',
    mandate: 'Strategy & decisions',
    color: '#9a8cff',
    mark: 'dia',
    grid: [-1, -1],
    height: 0.17,
    spend: '$6.10',
    budget: '$40 / day',
    brief:
      "Two pricing models are still open and both are defensible. I'd rather you pick one today than let the sales team keep quoting both — it's already showing up in win-rate noise.",
    agents: [
      { id: 'nadia', name: 'Nadia Okafor', role: 'Chief of Staff', mark: 'arc', status: 'working', doing: 'Sequencing the Q4 board agenda', load: 2, isHead: true },
      { id: 'wei', name: 'Wei Zhang', role: 'CTO, dotted line', mark: 'hex', status: 'idle', doing: 'Between sprints', load: 0 },
      { id: 'daniel-b', name: 'Daniel Meyer', role: 'CFO, dotted line', mark: 'square', status: 'working', doing: 'Closing the Q4 forecast', load: 3 },
    ],
    artifacts: [
      {
        id: 'pricing',
        kind: 'doc',
        title: 'Pricing model options',
        meta: 'Draft 2 · Nadia Okafor · 2 days ago',
        body: [
          'Tiered: $29 / $79 / $199. Cleaner story, higher expansion revenue, but the $29 tier will cannibalise the current $49 seat.',
          'Usage-based: $0.004 per release. Wins on enterprise, loses on predictability — every forecast I model comes back wide.',
          'Recommendation: tiered, with usage caps instead of feature gates.',
        ],
      },
      {
        id: 'agenda',
        kind: 'table',
        title: 'Q4 board agenda',
        meta: 'Locked · 4 items',
        columns: ['Item', 'Owner', 'Window'],
        rows: [
          ['Pricing decision', 'James', '15 min'],
          ['Q4 forecast vs plan', 'Daniel Meyer', '20 min'],
          ['Launch readiness', 'Alex Carter', '15 min'],
          ['Hiring envelope', 'Farah Haddad', '10 min'],
        ],
      },
    ],
    feed: [
      { time: '06:10', text: 'Consolidated three pricing memos into one brief', tone: 'work' },
      { time: '07:40', text: 'Flagged the win-rate noise to Sales', tone: 'wait' },
      { time: '08:25', text: 'Locked the Q4 agenda', tone: 'done' },
    ],
    gate: {
      title: 'Choose a pricing model',
      rows: [
        { k: 'Options', v: 'Tiered vs usage-based' },
        { k: 'Blocks', v: '4 quoting workflows · 2 in flight' },
        { k: 'Waiting', v: '2 days', tone: 'warn' },
        { k: 'Reversible', v: 'Yes, until published' },
      ],
    },
  },
  {
    id: 'research',
    name: 'Research Lab',
    short: 'Research',
    mandate: 'Evidence & insight',
    color: '#4fd1e0',
    mark: 'orb',
    grid: [0, -1],
    height: 0.12,
    spend: '$4.85',
    budget: '$40 / day',
    brief:
      'The audience is real and smaller than Marketing thinks. 12,400 contacts is the honest number; the 19,000 in the old deck included two segments that never converted.',
    agents: [
      { id: 'iris', name: 'Dr. Iris Chen', role: 'Head of Research', mark: 'orb', status: 'working', doing: 'Sizing the launch audience', load: 2, isHead: true },
      { id: 'sam', name: 'Sam Oyelaran', role: 'Market analyst', mark: 'wave', status: 'working', doing: 'Reading 14 competitor launches', load: 3 },
      { id: 'yuki', name: 'Yuki Tanaka', role: 'Competitive intel', mark: 'tri', status: 'blocked', doing: 'Waiting on data access', load: 1 },
    ],
    artifacts: [
      {
        id: 'sizing',
        kind: 'table',
        title: 'Audience sizing',
        meta: 'Verified · 08:02',
        columns: ['Segment', 'Reach', 'Confidence'],
        rows: [
          ['Existing customers', '6,900', 'High'],
          ['Trial → paid', '2,100', 'High'],
          ['High-intent leads', '3,400', 'Medium'],
          ['Dormant 90d+', '4,800', 'Low'],
        ],
      },
      {
        id: 'comp',
        kind: 'doc',
        title: 'Competitive read',
        meta: 'Memo · Sam Oyelaran',
        body: [
          'Four of the last six launches in this category led with speed, not features. The two that led with features underperformed on trial conversion.',
          'Nobody is claiming "release without anxiety" yet. That is the open line.',
        ],
      },
    ],
    feed: [
      { time: '04:55', text: 'Sized four audience segments from first-party data', tone: 'work' },
      { time: '07:30', text: 'Trimmed projected reach from 19,000 to 12,400', tone: 'done' },
      { time: '08:02', text: 'Requested warehouse access — blocked', tone: 'wait' },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing Studio',
    short: 'Marketing',
    mandate: 'Growth & brand',
    color: '#4c8dff',
    mark: 'bolt',
    grid: [1, -1],
    height: 0.14,
    spend: '$41.20',
    budget: '$75 / day',
    brief:
      "Everything's ready, James. Strategy is confirmed, the audience is sized, the creative is written, and the budget sits exactly on the Q4 floor at $250,000. Approve it and we start at 10:00. I'll report spend every morning and stop the flight if CPA goes past $45.",
    agents: [
      { id: 'alex', name: 'Alex Carter', role: 'Head of Marketing', mark: 'bolt', status: 'waiting', doing: 'Holding for your approval', load: 4, isHead: true, tier: 0 },
      { id: 'priya', name: 'Priya Raman', role: 'Content manager', mark: 'wave', status: 'working', doing: 'Running the launch email sequence', load: 3, tier: 1, reportsTo: 'alex' },
      { id: 'marco', name: 'Marco Silva', role: 'Social manager', mark: 'tri', status: 'waiting', doing: 'Holding ad spend until approval', load: 2, tier: 1, reportsTo: 'alex' },
      { id: 'jun', name: 'Jun Park', role: 'SEO manager', mark: 'ring', status: 'working', doing: 'Mapping 40 keywords to the launch', load: 2, tier: 1, reportsTo: 'alex' },
      { id: 'elena', name: 'Elena Ruiz', role: 'Copywriter', mark: 'star', status: 'working', doing: 'Drafting launch email 02', load: 3, tier: 2, reportsTo: 'priya' },
      { id: 'bo', name: 'Bo Nakamura', role: 'Editor', mark: 'square', status: 'working', doing: 'Holding three headlines to the tone guide', load: 2, tier: 2, reportsTo: 'priya' },
      { id: 'tasha', name: 'Tasha Bell', role: 'Content creator', mark: 'arc', status: 'working', doing: 'Cutting six social variants', load: 3, tier: 2, reportsTo: 'marco' },
      { id: 'omar', name: 'Omar Haddad', role: 'SEO analyst', mark: 'orb', status: 'working', doing: 'Auditing the landing page for intent', load: 1, tier: 2, reportsTo: 'jun' },
    ],
    readiness: [
      { label: 'Strategy & positioning confirmed', done: true },
      { label: 'Audience & targeting validated', done: true },
      { label: 'Creative assets ready (68 files)', done: true },
      { label: 'Budget & timeline approved', done: true },
      { label: 'Team & resources aligned', done: true },
    ],
    campaign: {
      name: 'Product Launch v2.0',
      stepper: ['Strategy', 'Audience', 'Creative', 'Budget', 'Approval'],
      current: 4,
    },
    artifacts: [
      {
        id: 'positioning',
        kind: 'doc',
        title: 'Positioning & narrative',
        meta: 'Draft 4 · Alex Carter · 06:12',
        body: [
          'For product teams drowning in manual release notes, Launchpad is the release surface that writes itself.',
          'We are not selling automation. We are selling the end of release anxiety.',
          'Tone: direct, unhedged, no exclamation marks. Claim only what the build can prove.',
        ],
      },
      {
        id: 'segments',
        kind: 'table',
        title: 'Audience segments',
        meta: 'Validated against Research · 08:04',
        columns: ['Segment', 'Size', 'Intent', 'First touch'],
        rows: [
          ['Existing customers', '6,900', 'High', 'Email 01'],
          ['Trial → paid', '2,100', 'High', 'Email 03'],
          ['High-intent leads', '3,400', 'Medium', 'Paid social'],
          ['Dormant 90d+', '4,800', 'Low', 'Retargeting'],
        ],
      },
      {
        id: 'creative',
        kind: 'list',
        title: 'Creative variants',
        meta: '6 generated · 3 kept',
        items: [
          { label: '“Ship on Friday and still sleep.”', sub: 'Hero · web + paid social' },
          { label: '“Your release notes wrote themselves.”', sub: 'Email subject A' },
          { label: '“Six weeks from build to launch.”', sub: 'Email subject B' },
        ],
      },
      {
        id: 'media',
        kind: 'table',
        title: 'Media plan',
        meta: 'Totals $250,000 · on plan',
        columns: ['Channel', 'Budget', 'Target CPA'],
        rows: [
          ['Email', '$0', '—'],
          ['Paid social', '$96,000', '$38'],
          ['Search', '$72,000', '$44'],
          ['Owned / web', '$18,000', '—'],
          ['Partner placements', '$64,000', '$51'],
        ],
      },
      {
        id: 'risks',
        kind: 'doc',
        title: 'Risks & assumptions',
        meta: 'Reviewed by Alex · 08:48',
        body: [
          'Paid social CPA is modelled at $38. It was $41 in October — a $6k overshoot is the realistic worst case.',
          'Email consent covers 6,900 customers. The dormant segment needs a re-consent pass before it can be mailed.',
          'Paid social copy needs legal sign-off before the flight starts.',
        ],
      },
    ],
    feed: [
      { time: '03:12', text: 'Drafted the media plan against the Q4 budget floor', tone: 'work' },
      { time: '05:40', text: 'Generated 6 creative variants, kept 3', tone: 'work' },
      { time: '07:05', text: 'Reconciled spend — $250,000 across 5 channels', tone: 'done' },
      { time: '08:14', text: 'Flagged legal review on paid social copy', tone: 'wait' },
      { time: '08:50', text: 'Marked the campaign ready for your approval', tone: 'done' },
    ],
    gate: {
      title: 'Authorise the campaign',
      rows: [
        { k: 'Channels', v: 'Email · Paid social · Search · Partners' },
        { k: 'Budget', v: '$250,000 over 6 weeks' },
        { k: 'Blast radius', v: '12,400 contacts · 68 assets' },
        { k: 'Agent spend', v: '$41.20 today · $75 cap' },
        { k: 'Reversible', v: 'Partially — scheduled email cannot be recalled', tone: 'warn' },
      ],
    },
  },
  {
    id: 'engineering',
    name: 'Engineering Floor',
    short: 'Engineering',
    mandate: 'Build & ship',
    color: '#93a7c4',
    mark: 'hex',
    grid: [-1, 0],
    height: 0.13,
    spend: '$58.90',
    budget: '$120 / day',
    brief:
      'Release 482 is green on staging and I want to widen the retry window before it goes to production. One call from you and the release train moves at 14:00.',
    agents: [
      { id: 'emeka', name: 'Emeka Nwosu', role: 'CTO', mark: 'hex', status: 'working', doing: 'Reviewing the retry change', load: 3, isHead: true },
      { id: 'lena', name: 'Lena Fischer', role: 'Platform', mark: 'square', status: 'working', doing: 'Running the release train', load: 4 },
      { id: 'tom', name: 'Tom Reilly', role: 'Reliability', mark: 'arc', status: 'waiting', doing: 'Needs your call on the rollout window', load: 2 },
    ],
    artifacts: [
      {
        id: 'retry',
        kind: 'diff',
        title: 'retry.ts — backoff change',
        meta: 'PR #482 · 2 files · +18 −6',
        diff: [
          { sign: ' ', text: 'export async function fetchWithRetry(url: string) {' },
          { sign: '-', text: '  return retry(() => fetch(url), { attempts: 2 })' },
          { sign: '+', text: '  return retry(() => fetch(url), { attempts: 3, backoff: "exp" })' },
          { sign: '+', text: '  // 30s ceiling — matches the upstream SLA' },
          { sign: ' ', text: '}' },
        ],
      },
      {
        id: 'notes',
        kind: 'doc',
        title: 'Release 482 notes',
        meta: 'Staging · 312 tests green',
        body: ['Retry ceiling widened from 2 attempts to 3 with exponential backoff.', 'No schema changes. Rollback is a redeploy of 481.'],
      },
      {
        id: 'prs',
        kind: 'list',
        title: 'Open pull requests',
        meta: '3 ready for review',
        items: [
          { label: 'Retry backoff (#482)', sub: 'Ready · needs your call' },
          { label: 'Cache warmup (#483)', sub: 'Draft' },
          { label: 'Drop unused flags (#484)', sub: 'Ready' },
        ],
      },
    ],
    feed: [
      { time: '02:40', text: 'Ran the full suite — 312 green', tone: 'done' },
      { time: '05:15', text: 'Opened #482 for the retry change', tone: 'work' },
      { time: '07:55', text: 'Deployed 481 to staging', tone: 'done' },
    ],
  },
  {
    id: 'operations',
    name: 'Operations Center',
    short: 'Operations',
    mandate: 'Run & optimise',
    color: '#3fcb9b',
    mark: 'arc',
    grid: [1, 0],
    height: 0.12,
    spend: '$18.40',
    budget: '$60 / day',
    brief:
      'Support cleared overnight for the first time in nine days. The only thing on my list is the vendor consolidation — it saves $2,400 a month and needs your signature before Friday.',
    agents: [
      { id: 'rosa', name: 'Rosa Delgado', role: 'COO', mark: 'arc', status: 'working', doing: 'Consolidating vendors', load: 2, isHead: true },
      { id: 'priya-n', name: 'Priya Nair', role: 'Support lead', mark: 'wave', status: 'working', doing: 'Clearing the overnight queue', load: 5 },
    ],
    artifacts: [
      {
        id: 'queue',
        kind: 'table',
        title: 'Support queue',
        meta: 'Live · 09:38',
        columns: ['Priority', 'Open', 'Oldest'],
        rows: [
          ['P1', '0', '—'],
          ['P2', '3', '4h'],
          ['P3', '11', '22h'],
        ],
      },
      {
        id: 'vendors',
        kind: 'doc',
        title: 'Vendor consolidation memo',
        meta: 'Ready to sign · Rosa Delgado',
        body: ['Nine tooling vendors collapse to five. Saves $2,400 a month, $28,800 a year.', 'Two contracts renew on Friday; signing after that costs another quarter.'],
      },
    ],
    feed: [
      { time: '01:20', text: 'Cleared the overnight support queue', tone: 'done' },
      { time: '06:45', text: 'Drafted the vendor consolidation memo', tone: 'work' },
    ],
  },
  {
    id: 'data',
    name: 'Data Center',
    short: 'Infrastructure',
    mandate: 'Infrastructure',
    color: '#5b7fa8',
    mark: 'ring',
    grid: [-1, 1],
    height: 0.1,
    spend: '$3.10',
    budget: '$40 / day',
    brief: 'All systems nominal. Nothing needs you. I will only surface this room if something changes.',
    agents: [
      { id: 'ivan', name: 'Ivan Petrov', role: 'Infrastructure', mark: 'ring', status: 'idle', doing: 'All systems nominal', load: 0, isHead: true },
      { id: 'sentinel', name: 'Sentinel', role: 'Monitoring', mark: 'orb', status: 'working', doing: 'Watching 41 checks', load: 1 },
    ],
    artifacts: [
      {
        id: 'health',
        kind: 'table',
        title: 'Service health',
        meta: '41 checks · all green',
        columns: ['Service', 'Uptime', 'p95'],
        rows: [
          ['API', '99.98%', '142ms'],
          ['Queue', '100%', '38ms'],
          ['Web', '99.99%', '211ms'],
        ],
      },
    ],
    feed: [
      { time: '00:05', text: 'Rotated logs, no anomalies', tone: 'work' },
      { time: '06:00', text: 'Nightly backup verified', tone: 'done' },
    ],
  },
  {
    id: 'people',
    name: 'People Hub',
    short: 'People',
    mandate: 'Talent & culture',
    color: '#e0758c',
    mark: 'star',
    grid: [0, 1],
    height: 0.11,
    spend: '$7.60',
    budget: '$40 / day',
    brief: 'Six engineers are in the pipeline and two are strong enough to move this week. I need headcount confirmed before I can make either offer.',
    agents: [
      { id: 'farah', name: 'Farah Haddad', role: 'Head of People', mark: 'star', status: 'working', doing: 'Screening 6 engineer candidates', load: 3, isHead: true },
      { id: 'otto', name: 'Otto Lind', role: 'Recruiting', mark: 'tri', status: 'working', doing: 'Scheduling final rounds', load: 2 },
    ],
    artifacts: [
      {
        id: 'pipeline',
        kind: 'list',
        title: 'Hiring pipeline',
        meta: '6 active · 2 ready to offer',
        items: [
          { label: 'Senior engineer — A. Rahman', sub: 'Strong yes · ready to offer' },
          { label: 'Platform engineer — K. Duval', sub: 'Strong yes · ready to offer' },
          { label: 'Support engineer — 2 candidates', sub: 'Final round this week' },
        ],
      },
    ],
    feed: [
      { time: '07:10', text: 'Screened 6 candidates, advanced 2', tone: 'work' },
      { time: '08:30', text: 'Blocked on headcount confirmation', tone: 'wait' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance Office',
    short: 'Finance',
    mandate: 'Financial health',
    color: '#e0b45a',
    mark: 'square',
    grid: [1, 1],
    height: 0.12,
    spend: '$12.30',
    budget: '$50 / day',
    brief:
      'The Q4 forecast is closing 4.1% over plan, which is good news you get to spend. Confirm the headcount envelope and I will release the two offers People is holding.',
    agents: [
      { id: 'daniel', name: 'Daniel Meyer', role: 'CFO', mark: 'square', status: 'working', doing: 'Closing the Q4 forecast', load: 3, isHead: true },
      { id: 'anya', name: 'Anya Sokolova', role: 'Financial analyst', mark: 'wave', status: 'working', doing: 'Reconciling campaign spend', load: 2 },
    ],
    artifacts: [
      {
        id: 'forecast',
        kind: 'table',
        title: 'Q4 forecast vs plan',
        meta: 'Refreshed 07:20',
        columns: ['Line', 'Plan', 'Forecast'],
        rows: [
          ['Revenue', '$1.19M', '$1.24M'],
          ['Gross margin', '78%', '81%'],
          ['Burn', '$214k/mo', '$215k/mo'],
          ['Runway', '11.0 mo', '11.2 mo'],
        ],
      },
      {
        id: 'budgetnote',
        kind: 'doc',
        title: 'Campaign budget note',
        meta: 'Daniel Meyer · 08:05',
        body: ['The $250,000 campaign sits inside the Q4 marketing envelope with $18,000 of headroom.', 'If CPA runs to $45 rather than $38, the headroom is gone but the plan still clears.'],
      },
    ],
    feed: [
      { time: '05:50', text: 'Refreshed the forecast — +4.1% vs plan', tone: 'done' },
      { time: '07:20', text: 'Reconciled Marketing spend to the envelope', tone: 'work' },
      { time: '08:05', text: 'Holding 2 offers pending headcount', tone: 'wait' },
    ],
    gate: {
      title: 'Confirm Q4 headcount',
      rows: [
        { k: 'Roles', v: '4 — 2 engineering, 1 support, 1 design' },
        { k: 'Cost', v: '$612,000 annualised' },
        { k: 'Vs envelope', v: '+2.1% — inside headroom' },
        { k: 'Reversible', v: 'Yes, until offers are signed', tone: 'good' },
      ],
    },
  },
]

export const HEAD_IDS: DeptId[] = ['marketing', 'engineering', 'research', 'operations', 'finance']

export const OVERNIGHT = [
  { text: 'Marketing finalised the v2.0 campaign — 68 assets', time: '08:50' },
  { text: 'Q4 forecast refreshed: +4.1% vs plan', time: '07:20' },
  { text: 'Build #482 deployed to staging, 312 tests green', time: '07:55' },
  { text: 'Support queue cleared for the first time in 9 days', time: '01:20' },
  { text: 'Daily performance report generated', time: '06:00' },
]

export const WORRY =
  'Paid social CPA drifted from $38 to $41 in October. Marketing built the $250k plan on the old number — the downside is about $6k, not catastrophic, but it will land on day 12, not day 1.'

/** The queue Hermes keeps — also what voice commands act on. */
export const NEEDS: {
  id: DeptId
  label: string
  meta: string
  impact: 'High' | 'Medium'
  /** how Hermes says it out loud */
  said: string
}[] = [
  {
    id: 'marketing',
    label: 'Approve the Product Launch v2.0 campaign',
    meta: 'Marketing · $250,000 · 6 weeks',
    impact: 'High',
    said: 'the launch',
  },
  {
    id: 'finance',
    label: 'Confirm Q4 headcount before close',
    meta: 'Finance · due today 14:00',
    impact: 'Medium',
    said: 'the headcount',
  },
  {
    id: 'board',
    label: 'Take the launch to the c-suite',
    meta: 'Board room · 5 seats · 20 min',
    impact: 'High',
    said: 'the board',
  },
]
