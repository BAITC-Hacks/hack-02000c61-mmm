# Official Career Quest datasets

Place the organizer-provided files in this directory when they become available:

- `employees.json`
- `events.json`
- `skills.json`
- `activity_history.csv`

No schemas are assumed yet. Before connecting these files, inspect their exact roots, field names, identifiers, value ranges, null behavior, and cross-file relationships. The backend loader will then normalize the official format without leaking source-specific fields into recommendation logic.

Do not replace the frontend mock data with guessed dataset structures. Demo-only data currently lives in `frontend/src/mocks/` and is deliberately isolated from production integration code.

