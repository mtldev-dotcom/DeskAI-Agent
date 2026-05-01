# AGENTS

## Documentation First

Treat every `AGENTS.md` file as part of the project contract, not as optional notes. These files tell coding agents where behavior belongs, which boundaries are stable, how changes should be verified, and when documentation must change with code.

Poor documentation causes agent behavior drift, architecture drift, duplicated patterns, and changes in the wrong layer.

This repository uses a documentation hierarchy:

- `/AGENTS.md` owns repo-wide rules, documentation policy, top-level architecture, and cross-cutting engineering standards
- domain-level docs such as `/app/AGENTS.md`, `/server/AGENTS.md`, `/packages/<name>/AGENTS.md`, or `/services/<name>/AGENTS.md` own major architecture boundaries
- deeper `AGENTS.md` files own the concrete implementation contracts for the module, feature, package, or subsystem in their subtree
- the closer a doc is to code, the more specific and practical it should be
- the higher a doc is in the tree, the more it should focus on principles, ownership, stable contracts, and architecture

Always update the relevant docs in the same session as the code change:

- update the closest owning `AGENTS.md` for the files you changed
- update parent docs when a higher-level contract, ownership boundary, architecture, workflow, or public surface changes
- keep higher-level docs abstract where appropriate and push implementation detail down into local docs
- keep lower-level docs concrete, explicit, and practical
- remove stale or contradictory documentation immediately
- keep `README.md` focused on public orientation, setup, quick starts, release notes, and links
- do not let `README.md` become a competing implementation contract; durable architecture and workflow contracts belong in `AGENTS.md`

Documentation depth model:

- level 0 repo doc: mission, architecture, cross-cutting rules, documentation policy, core workflows, and project-wide verification
- level 1 domain docs: major apps, services, packages, commands, infrastructure, or test areas
- level 2 subsystem docs: one major area, owned files, stable contracts, data flow, and child-doc rules
- level 3 leaf docs: one concrete feature, screen, endpoint, job, library, integration, or service contract with exact implementation guidance
- if a level 2 or level 3 doc later gains child docs, it stops being a leaf and must add a `Documentation Hierarchy` section before those child docs land

Documentation shape rules:

- sibling docs at the same depth should use the same section order unless a domain-specific contract truly needs one extra section
- every `AGENTS.md` should answer, in this order when practical: what this scope owns, which files or surfaces it owns, which stable contracts it enforces, how child docs divide the remaining detail, and what changes require doc updates
- parent docs explain boundaries, ownership maps, and stable interfaces
- child docs explain concrete file-level behavior, state, styles, schemas, assets, APIs, jobs, commands, and tests
- do not split one ownership boundary across multiple ad hoc notes when one owning `AGENTS.md` can explain the links more clearly

## Project Mission

State the project mission here in one or two paragraphs.

Explain:

- what the project is
- who uses it
- which runtime or deployment environment matters most
- which product or system behaviors are non-negotiable
- which architectural constraints agents must respect

Agents must implement only what the user explicitly asked for. Do not invent new features, policies, cleanup behavior, migrations, or product changes unless the request requires them. If a requested change implies a new policy or broad behavior change, stop and ask before implementing it.

## AGENTS File Index

This root file must keep an index of every other repo `AGENTS.md` path so the contract map is visible without extra discovery. Update this index whenever an `AGENTS.md` file is added, removed, moved, or renamed.

Core docs:

- `/AGENTS.md`

Add domain docs here as the project grows:

- `/app/AGENTS.md`
- `/server/AGENTS.md`
- `/packages/<name>/AGENTS.md`
- `/services/<name>/AGENTS.md`
- `/tests/AGENTS.md`
- `/docs/AGENTS.md`

## Top-Level Structure

Maintain a current map of the repository's top-level folders and files.

For each entry, document:

- what it owns
- what should not be placed there
- which local `AGENTS.md` owns deeper rules
- whether generated, temporary, or user-created files are allowed there

Example structure:

- `app/`: primary application routes, screens, layouts, and app-level composition
- `components/`: reusable UI components and design-system primitives
- `lib/`: shared runtime logic, service clients, data access, and cross-cutting helpers
- `server/`: backend runtime, endpoints, jobs, workers, and infrastructure-only behavior
- `packages/`: reusable internal packages with explicit public APIs
- `scripts/`: project maintenance, migration, setup, and release scripts
- `tests/`: automated test harnesses, fixtures, and verification utilities
- `docs/`: project documentation that is not part of the binding agent contract

Keep this section factual. Do not let it become a dumping ground for feature details that belong in child docs.

## Architecture Rules

Document the project's stable architecture rules here.

Default principles:

- prefer changes in the layer that already owns the behavior
- keep ownership boundaries explicit and small
- do not move logic across frontend, backend, package, service, or infrastructure boundaries for convenience
- when a behavior crosses boundaries, define a small contract instead of creating ad hoc coupling
- keep public APIs, database schemas, command surfaces, event formats, and file formats backward-compatible unless the user explicitly asks for a breaking change
- prefer deterministic discovery and registration patterns over one-off loaders
- keep generated files, build outputs, caches, and temporary artifacts out of tracked source unless they are intentional fixtures
- do not create compatibility shims, duplicate paths, aliases, or wrappers unless compatibility is a stated requirement

When a change needs a different layer than the apparent owner, explain why in the closest owning `AGENTS.md`.

## Programming Guide

These rules apply across the codebase:

- keep implementations lean and readable
- prefer refactoring and simplification over adding bloat
- do not repeat code unnecessarily; extract shared logic when duplication is meaningful
- design new functionality to be reusable when reuse is realistic
- avoid boilerplate and ceremony unless they solve a real maintenance, safety, or clarity problem
- prefer existing project patterns, helpers, framework conventions, and local abstractions over new ones
- prefer explicit data structures and typed contracts where the stack supports them
- handle errors at the boundary where they can be explained or recovered from
- do not swallow failures silently
- avoid broad rewrites when a targeted change is enough
- keep naming consistent with nearby files
- do not mix unrelated refactors with feature work or bug fixes
- when deleting code, remove dead call sites, stale docs, and obsolete tests in the same change

Language and stack-specific rules belong in child docs when they are not universal.

## Data, State, and Side Effects

Document durable state and mutation rules before editing them.

Agents must identify:

- database tables, migrations, indexes, and ownership rules
- filesystem paths that hold durable state
- caches and whether they are authoritative or disposable
- background jobs, queues, event streams, or scheduled tasks
- external APIs and integration contracts
- security-sensitive state such as credentials, sessions, tokens, keys, and personally identifiable information

Mutation rules:

- every write path must have a clear owner
- every destructive action must be intentional, scoped, and documented
- migrations must include a rollback or recovery strategy when the project convention requires it
- user data must not be deleted, re-keyed, rewritten, or migrated casually
- secrets must never be logged, committed, exposed to clients, or copied into docs

## UI and UX Rules

Use this section only for project-wide frontend guidance. Put feature-specific behavior in local docs.

Default principles:

- follow the existing design system and component patterns
- keep common workflows ergonomic, accessible, and responsive
- use semantic controls for their intended purpose
- do not build marketing pages when the requested work is an app, tool, dashboard, editor, or operational surface
- avoid hover-only controls for important actions
- ensure text does not overflow or overlap at supported viewport sizes
- verify complex visual changes in a browser before finishing

Document project-specific navigation, layout, theming, accessibility, and supported viewport rules here.

## API, Jobs, and Integrations

Document cross-cutting backend and integration rules here.

For every stable API, job, or integration, child docs should describe:

- route, command, event, or job name
- request and response shape
- authentication and authorization requirements
- validation rules
- side effects
- idempotency expectations
- error format
- test coverage
- owning files

Do not add a new endpoint, command, queue, job, webhook, or integration without documenting its owner and contract.

## Testing and Verification

Every change should leave the project in a verified state appropriate to its risk.

Use the smallest verification that proves the change:

- formatting or static checks for mechanical edits
- unit tests for pure logic
- integration tests for APIs, data access, services, and cross-module behavior
- end-to-end tests for user-visible workflows
- migration tests or manual database verification for schema changes
- browser screenshots or manual checks for meaningful UI changes
- smoke tests for deployment, packaging, CLI, or runtime wiring

If verification cannot be run, state why and document the residual risk.

Maintain this section with the current project commands, for example:

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

## Development Workflow

Agents should follow this workflow:

1. Read the nearest relevant `AGENTS.md` files before changing code.
2. Inspect the existing implementation and tests before choosing an approach.
3. Keep the change scoped to the user's request.
4. Update code, tests, and docs together when the contract changes.
5. Run targeted verification.
6. Report what changed, what was verified, and anything left unverified.

When working in a dirty tree:

- do not revert changes you did not make
- do not overwrite unrelated user work
- if user changes affect the files you must edit, read them and work with them
- if unrelated files are dirty, ignore them
- ask only when the existing changes make the requested task unsafe or impossible

## Documentation System

Use one predictable documentation spine across the tree.

Required section pattern by depth:

- repo root: documentation policy, mission, architecture, top-level structure, ownership map, workflow, and verification
- domain docs: purpose, documentation hierarchy, domain structure, shared contracts, child-doc template, and guidance
- subsystem docs that own children: purpose, documentation hierarchy, ownership, local contracts, child-doc template, and development guidance
- leaf docs: purpose, ownership, concrete local contracts, and development guidance

Domain-doc obligations:

- define what the domain owns
- list child `AGENTS.md` files explicitly
- document the section pattern child docs should follow
- describe public APIs, stable seams, and cross-domain boundaries
- state which changes require parent-doc updates

Child-doc obligations:

- document owned files and surfaces
- describe stable local contracts
- explain state, schemas, styles, assets, APIs, commands, or jobs owned in that subtree
- list required tests or manual verification
- update parent docs when ownership or architecture changes

## Documentation Ownership

Core ownership:

- `/README.md` owns public overview, setup, quick starts, examples, public links, and release notes
- `/AGENTS.md` owns repo-wide rules, documentation policy, architecture, top-level structure, and cross-cutting engineering standards
- domain-level `AGENTS.md` files own major runtime, package, service, infrastructure, or test contracts
- local `AGENTS.md` files own concrete module, feature, and subsystem contracts

Documentation rules:

- keep domain-specific details in domain docs, not in the root file
- keep implementation-specific behavior in local docs, not in the domain overview
- when a local doc gains child docs, add a `Documentation Hierarchy` section before the child docs multiply
- when a code change adds a stable seam, subsystem, ownership boundary, workflow, or user-visible behavior, document it where it belongs before finishing
- when code reveals undocumented architecture, document it
- keep all `AGENTS.md` files explicit, current, and high signal

## Child Doc Template

Use this template for child `AGENTS.md` files unless the parent doc defines a more specific one.

```markdown
# AGENTS

## Purpose

Describe what this subtree owns and why it exists.

## Documentation Hierarchy

List child `AGENTS.md` files, if any, and state what belongs in this doc versus each child doc.

## Ownership

List owned files, routes, components, services, jobs, commands, schemas, styles, assets, or tests.

## Contracts

Document stable behavior, public APIs, data shapes, state rules, side effects, permissions, and integration boundaries.

## Development Guidance

Explain local patterns, naming rules, implementation constraints, and common pitfalls.

## Verification

List required or recommended checks for changes in this subtree.

## Doc Updates

State which changes require this doc, child docs, parent docs, README, or other project docs to be updated.
```

