# Career Quest

**Career Quest** is an explainable career development navigator created for the HackAlem AI Hackathon, Halyk Bank track.

It answers one practical question for every employee:

> Where am I now, what is blocking me from reaching the next career grade, and what should I do next?

The current repository contains a polished, interactive MVP foundation. It demonstrates the employee and HR experiences with clearly isolated mock data while the official hackathon datasets are pending.

## The problem

Employees often see a catalog of courses but not a coherent path to career growth. A useful navigator must connect an employee's current grade, target-grade expectations, capability gaps, activity history, and available development opportunities. It must also explain why a particular step matters.

Selecting only the employee's lowest skill is not enough. A smaller gap in a promotion-critical capability may be more valuable than a larger gap in an activity the employee has repeatedly skipped.

## Career GPS

Career Quest frames development as a route rather than a catalog:

```text
You are here → Your target → The best next step → Why it matters → Expected progress
```

The employee view makes that route tangible through:

- a current-to-target career trajectory;
- readiness and capability-gap visuals;
- one to three explainable next-step cards;
- a what-if preview of career and skill impact;
- an interactive activity-completion demo; and
- a history of completed, skipped, and upcoming activities.

The HR view turns the same concept into organization-level signals: common skill gaps, participation, development status, and employees who need guidance.

## Current implementation status

### Implemented now

- React application with `/employee` and `/hr` routes; `/` redirects to `/employee`.
- Responsive desktop-first enterprise interface with reusable components.
- Three switchable demo employee profiles.
- Career trajectory, readiness, skill-gap, recommendation, what-if, and history views.
- Local demo completion flow that updates the selected skill, readiness, history, and next visible recommendation.
- HR KPI cards, Recharts visualizations, and an employee guidance table.
- All employee and HR demo values isolated under `frontend/src/mocks/`.
- FastAPI application with `GET /health`.
- Backend boundaries for future loading, progress, recommendation, analytics, and explanation services.
- No API key required to run either application.

### Planned after official datasets arrive

- Exact JSON/CSV parsing and validation.
- Source-to-domain data normalization.
- Real grade requirement and readiness calculations.
- Deterministic activity eligibility, scoring, and ranking.
- Real activity completion effects and persisted history.
- HR aggregates calculated from official employee data.
- Grounded LLM explanations generated only from ranking evidence.

The recommendations and analytics shown today are demo UI data, not output from a production recommendation model.

## Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│ React + TypeScript                                               │
│ Employee Career GPS · What-if UI · HR Analytics                  │
└───────────────────────────────┬──────────────────────────────────┘
                                │ future API integration
┌───────────────────────────────▼──────────────────────────────────┐
│ FastAPI                                                         │
│ Data boundary · Progress · Recommendation · Analytics            │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                  official JSON / CSV datasets
```

The intended recommendation pipeline is:

```text
Official dataset
      ↓
Validation and normalization
      ↓
Skill-gap + grade-requirement + activity-history analyzers
      ↓
Deterministic eligibility and ranking
      ↓
Top 1–3 activities with structured evidence
      ↓
LLM explanation layer (language only)
      ↓
Human-readable, evidence-grounded explanation
```

Frontend mock state and backend production boundaries are deliberately separate. The current interaction can be replaced without rewriting the presentation components.

## Planned recommendation approach

Ranking will be deterministic and multi-factor. Conceptually:

```text
recommendation score =
    skill gap factor
  + next-grade importance
  + activity relevance
  + positive history signal
  - repeated skip penalty
  - refusal penalty
  - repetition penalty
```

Final features and weights are intentionally undefined until the official schemas and value distributions are inspected. This prevents assumptions from becoming hidden business rules.

Each ranked activity will carry a structured evidence package containing only normalized facts and deterministic calculations. That evidence will power both the visual “Why this?” breakdown and the optional language layer.

## Explainability and LLM safety

The LLM will never choose or rank an activity. Its single responsibility will be to convert an already-ranked evidence package into concise natural language.

Guardrails:

- prompts receive evidence, not an unrestricted employee record;
- generated claims must be traceable to supplied evidence;
- ranking remains available and reproducible without an LLM;
- failed or invalid generation falls back to a deterministic template; and
- the application starts without an LLM API key.

The backend currently includes the explanation interface and safe template fallback. No external LLM call is implemented yet.

## Dataset integration plan

Expected organizer files:

- `data/employees.json`
- `data/events.json`
- `data/skills.json`
- `data/activity_history.csv`

They are not currently available, so this project does not invent their fields. When received, the team will:

1. inspect roots, field names, types, identifiers, enums, nulls, and relationships;
2. define source validators for the exact official format;
3. normalize source records behind the backend data boundary;
4. test additional profiles and history rows in the same format; and
5. replace only the mock adapter—not UI business presentation—with API data.

See [`data/README.md`](data/README.md) for placement details.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Python, FastAPI, Pydantic |
| API server | Uvicorn |

## Run the frontend

Prerequisites: Node.js 20+ and npm.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Useful verification commands:

```bash
npm run typecheck
npm run build
```

## Run the backend

Prerequisite: Python 3.11+.

From the repository root:

```bash
python -m venv backend/.venv
```

Windows PowerShell:

```powershell
backend\.venv\Scripts\python -m pip install -r backend\requirements.txt
cd backend
.\.venv\Scripts\python -m uvicorn app.main:app --reload
```

macOS/Linux:

```bash
backend/.venv/bin/python -m pip install -r backend/requirements.txt
cd backend
./.venv/bin/python -m uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Verify it with:

```http
GET /health
```

```json
{
  "status": "ok",
  "service": "career-quest-api"
}
```

Interactive API documentation is available at `http://localhost:8000/docs`.

## Repository structure

```text
.
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable employee and HR UI
│   │   ├── layouts/          # Application shell and navigation
│   │   ├── mocks/            # All temporary demo data
│   │   ├── pages/            # /employee and /hr views
│   │   ├── types/            # Strict UI-facing TypeScript types
│   │   └── utils/            # Mock progress helpers
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/              # HTTP routes
│   │   ├── models/           # API boundary models
│   │   ├── services/         # Data and explanation boundaries
│   │   ├── recommendation/   # Future deterministic engine contract
│   │   ├── analytics/        # Future HR aggregate contract
│   │   └── progress/         # Future readiness contract
│   └── requirements.txt
├── data/
│   └── README.md             # Official dataset placement contract
└── .env.example
```

## Demo flow

1. Open the employee dashboard and switch between demo profiles.
2. Review the career trajectory and target-grade gaps.
3. Expand “Why this?” on the primary next step.
4. Select another activity to update the what-if panel.
5. Complete an activity and watch readiness, capability, history, and recommendations update.
6. Switch to HR Analytics to review organizational development signals.

---

Built for HackAlem AI Hackathon · Halyk Bank track. The interface is original and does not use official bank assets.
