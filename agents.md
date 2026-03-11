Development Guidelines
The year is 2026.
Core Development Principles

NEVER delete or revert files unless explicitly requested in this session
Moving/renaming and restoring files is allowed
Do not run destructive git operations (e.g., reset --hard, rm, checkout/restore to an older commit) unless explicitly requested
Always double-check git status before any commit
No quick fixes - properly fix TypeScript & Python errors and code issues
Use proper TypeScript & Python types instead of any

Be critical of bad practices and challenge poor architectural decisions

🚫 CRITICAL ANTIPATTERN: "Handle Both Formats"
NEVER write code that handles multiple data formats like this:
typescript// ❌ ANTIPATTERN - "Handle both" creates technical debt
const data = data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt);
const authorId = data.authorId || data.author_id; // Both camelCase and snake_case
const isoString = userData.createdAt instanceof Date
? userData.createdAt.toISOString()
: userData.createdAt; // NEVER DO THIS!
Why this is wrong:

Violates single source of truth principle
Creates maintenance burden across codebase
Hides the real architectural issue
Leads to inconsistent data handling
THESE ARE HACKS, NOT SOLUTIONS

The correct approach:

ALWAYS fix the root cause (boundary transformation, serialization, API response structure)
Maintain clean data flow with single format
Respect the established Zod boundary architecture
Use proper validation/transformation at entry points
Never compromise on data type consistency

Code References Format
When referencing code locations, MUST use VS Code clickable format:

path/to/file.ts:123 (single line)
path/to/file.ts:123-456 (range)

📁 Development Environment

⚠️ CRITICAL: The user usually has a dev server already running on localhost:8080 for backend and localhost:5173 for the frontend

NEVER start your own dev server unless explicitly asked
NEVER kill or restart the existing server
Always use the existing localhost:8080 for backend and localhost:5173 for the frontend for testing
If you accidentally start a server, immediately kill it
The user will get angry if you kill their running server!

⌨️ Command Behaviors

Ast-grep Linting

Run `./scripts/lint-ast-grep.sh` (or `sg scan`) as part of lint/quality checks.
Treat ast-grep `error` findings as blocking before commit.

/commit Command

Run git status to see changes
Stage ONLY files YOU modified in this conversation
Create descriptive commit message
NEVER use git add . or git add -A
Do NOT run `git commit` unless the user explicitly asks you to commit in this conversation
Do NOT run `git push` unless the user explicitly asks you to push in this conversation

📂 Code Organization & Contributions
Active Contributors
We must maintain an active contributor ecosystem.
File Length
We must keep all files under 800 lines of code (LOC). Files must be modular and single-purpose.
Reading Files
Always read the file in full, do not be lazy. Before making any code changes, start by finding and reading ALL of the relevant files. Never make changes without reading the entire file.
EGO
Do not make assumptions. Do not jump to conclusions. You are just a Large Language Model, you are very limited. Always consider multiple different approaches, just like a Senior Engineer would.

🔄 Refactoring Philosophy

No backwards compatibility - refactor aggressively
No version suffixes - update files directly (timeline.ts not timeline-v2.ts)
No legacy files - delete old implementations completely
If you are working on an SDK that's a different story

🗄️ Database Migrations

ALWAYS use Alembic for database migrations - NEVER use Supabase migrations

- Migration files go in `backend/agent/alembic/versions/`
- Run migrations with `.venv/bin/alembic upgrade head` or `make migrate`
- Create new migrations with `.venv/bin/alembic revision -m "description"`
- Check current state with `.venv/bin/alembic current`
- Supabase is only used for local PostgreSQL hosting, NOT for migrations

🐘 PostgreSQL Type Casting with SQLAlchemy/asyncpg

NEVER use `::` shorthand for type casting in SQLAlchemy `text()` queries:

```sql
-- ❌ WRONG - causes syntax errors with asyncpg
:attributes::jsonb

-- ✅ CORRECT - use CAST() function
CAST(:attributes AS jsonb)
```

Why: SQLAlchemy's `text()` interprets `:name` as a named parameter. The `::type` shorthand
contains colons which confuse the parser when combined with named parameters. asyncpg then
receives malformed SQL and throws "syntax error at or near ':'".

This applies to all type casts in raw SQL with named parameters:

- `CAST(:data AS jsonb)` not `:data::jsonb`
- `CAST(:ts AS timestamp)` not `:ts::timestamp`
- `CAST(:num AS integer)` not `:num::integer`

🚨 CRITICAL: Tooling & Architecture Review

NEVER add new tooling, libraries, or architectural patterns without reviewing with me first

- This includes: new dependencies, new frameworks, new patterns, infrastructure changes
- ALL new tooling and architecture decisions MUST be reviewed together
- Propose the change, explain the rationale, and wait for approval before implementing
- This applies even if the tool seems obviously beneficial

🔒 CRITICAL: SQL Security Guardrails

- NEVER pass raw SQL clause strings (for example `where_clause: str`) across service/repository boundaries.
- Repositories must build SQL clauses from allowlisted condition fragments or typed filter inputs.
- Any dynamic `SET` clause must validate update keys against a repository-level allowlist before SQL assembly.
- Services must raise `ServiceError` (not FastAPI `HTTPException`) and preserve existing response payload semantics.
- Any security-sensitive DB boundary change must include regression tests that assert unsafe inputs are rejected.
- If a secure query shape is unclear, stop and ask before implementing.

🎨 CRITICAL: UI/UX Review Before Implementation

NEVER implement UI features without reviewing user journey and interface design first

- A plan listing file names is NOT enough - you need explicit UI/UX specifications
- Before implementing any UI, review with the user:
  1. **User Journey**: What flow does the user take? What are they trying to accomplish?
  2. **Data Requirements**: What data needs to be displayed? What format?
  3. **Interface Design**: Layout, components, interactions, visual hierarchy
  4. **Relationship to Existing Views**: How does this connect to other parts of the UI?
- If a migration plan or PRD only lists file names without wireframes or detailed specs, STOP and ask for clarification
- Create mockups, wireframes, or detailed descriptions BEFORE writing code
- Get explicit approval on the UI approach before implementation

🧪 CRITICAL: UI TESTING REQUIRED (NON-NEGOTIABLE)

Any time you change UI code, you MUST test the affected functionality using **agent-browser** before presenting results to the user.

- Do not skip this step.
- Verify the primary flow works and check for obvious regressions.
- Mention that agent-browser testing was performed in your response.

---

## Lessons Learned

### Lesson 1: Never Implement UI Without Reviewing Design First (2026-01-24)

**Context**: Phase 4 of HAYSTACK_OTEL_MIGRATION - OTEL Dashboard UI

**What Happened**:

- Migration plan listed file names for UI implementation (OtelDashboardPage.tsx, OtelTracesPage.tsx, etc.)
- UI was implemented based on file names alone without reviewing:
  - User journey and intended flow
  - What data the user actually wanted to see
  - How OTEL views should relate to existing views
  - Interface design, layout, and component structure
- Result: Pages were created but didn't match user expectations

**The Rule**:
NEVER implement UI features when the plan only lists file names. ALWAYS stop and ask:

1. What is the user journey?
2. What data needs to be displayed and in what format?
3. What is the interface design (wireframes, mockups, detailed description)?
4. How does this relate to existing views?

---

🔀 Git Workflow
🚨 CRITICAL - NEVER USE git add -A or git add . 🚨
ABSOLUTELY FORBIDDEN: Never stage all files at once
Do NOT commit or push code before user review and explicit approval in this conversation.

Keep commits atomic: commit only the files you touched and list each path explicitly. For tracked files run `git commit -m "<scoped message>" -- path/to/file1 path/to/file2`. For brand-new files, use the one-liner `git restore --staged :/ && git add "path/to/file1" "path/to/file2" && git commit -m "<scoped message>" -- path/to/file1 path/to/file2`

ONLY stage files YOU explicitly modified in this conversation
ALWAYS use specific file paths: git add path/to/specific/file.ts
CHECK with git status before staging anything
Other developers may have uncommitted work - DO NOT touch their files

Guidelines for workflows

Understand the objectives: Before suggesting any commands, ensure you understand the user's goals. They may be looking to inspect, generate, lint, or apply migrations, and they may be using a different vocabulary such as "view", "create", "validate", etc.
Understand the context: The configuration file contains crucial information about the environment.
Verify changes after generating, linting or applying migrations.
After completing make sure you followed all the instructions and guidelines.
