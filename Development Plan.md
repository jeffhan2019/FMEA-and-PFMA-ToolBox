# Development Plan - TSF FMEA Web Application

## Assumptions
- The product is an internal enterprise web app used by dam safety and geotechnical teams, with optional external reviewer access.
- Initial deployment targets one organization, with configurable terminology and scoring so additional organizations can onboard later.
- Legal/regulatory support is out of scope; the system provides configurable governance and documented decision records, not compliance guarantees.
- A default stack of React + TypeScript frontend, Node.js API, and PostgreSQL database is acceptable.
- Single sign-on (SSO) integration is preferred if available; local auth can be used for MVP.
- File uploads may be metadata-only in MVP, with links to controlled document repositories.
- The first release focuses on one TSF facility model and one approval workflow, then expands to multi-facility governance patterns.

## Open Questions (Resolve in Discovery)
1. Which identity provider and authentication standard are required (Azure AD/OIDC/SAML/local)?
2. Should approved baselines be fully immutable, or allow controlled amendment workflows?
3. What is the preferred scoring method at go-live (RPN, qualitative matrix, or both)?
4. Is electronic signature required for approvals at launch?
5. What data residency and hosting constraints apply (region, cloud provider, on-prem)?
6. Are SCADA/instrument integrations in scope for MVP or phase 2?
7. What report template standard is required (corporate template, regulator template, both)?
8. What import quality threshold is needed (strict schema validation vs guided correction)?

## Product Scope and Objectives
- Build a collaborative FMEA workspace for TSFs and tailings dams.
- Ensure strong traceability across components, failure modes, controls, instruments, and actions.
- Support lifecycle workflows across design/construction and operation/maintenance.
- Provide auditable change history and approval baselines with role-based governance.
- Deliver performant table editing for thousands of rows and robust enterprise security.

## Workstreams

### 1) Information Architecture and Domain Model
- Define core entities:
  - `Organization`, `User`, `Role`, `Permission`
  - `Project`, `Facility`, `DamSystem`, `Component`, `Element`
  - `FmeaSession` (baseline/revision), `FmeaItem`
  - `LoadingCondition`, `FailureMechanism`, `InitiatingEvent`
  - `EffectLocal`, `EffectSystem`, `ConsequenceCategory`
  - `ScoringModel`, `ScaleDefinition`, `ScoreEntry` (S/O/D)
  - `Control`, `DetectionMethod`, `InstrumentRef`, `InspectionChecklistRef`, `ScadaLogicRef`
  - `RiskAction`, `ActionEvidence`, `ReferenceLink`, `AttachmentMeta`
  - `WorkflowState`, `ApprovalRecord`, `AuditEvent`, `ChangeSet`
- Model relationships:
  - One facility has many systems/components/elements.
  - One session has many line items and a locked scoring model snapshot.
  - One FMEA item links many controls, detection methods, references, and actions.
  - One action has ownership, due date, status, and verification evidence.
  - Audit events are append-only and reference actor, entity, before/after, and timestamp.
- Build taxonomy libraries with versioned seed data and extensibility controls.

### 2) UX and Key Screens
- Project/facility home with session cards, status, risk summary, and pending actions.
- Spreadsheet-like FMEA editor with:
  - Keyboard navigation, inline edit, bulk update, filters, saved views.
  - Component hierarchy picker and taxonomy-assisted failure mode entry.
  - On-row scoring guidance and configurable scoring definitions.
- Traceability matrix view:
  - Failure mode <-> controls <-> instruments <-> actions.
  - Highlight monitoring and control coverage gaps.
- Workflow and approvals panel:
  - Draft -> In Review -> Approved -> Superseded.
  - Optional electronic sign-off and comment threads.
- Revision compare view:
  - Row-level and field-level diff between baselines.
- Reports and exports:
  - Printable report with logo/organization fields and standardized sections.
- Admin console:
  - Roles/permissions, templates, scale governance, taxonomy management.

### 3) API and Integration Layer
- Choose REST API with versioned endpoints.
- Core endpoint groups:
  - Auth/session: login, token refresh, session management.
  - Projects/facilities/components CRUD.
  - FMEA sessions: create, clone revision, change state, compare.
  - FMEA items CRUD with batch operations.
  - Scoring definitions and model locking.
  - Controls, detection methods, and traceability links.
  - Actions/evidence/status updates.
  - Import/export: CSV/XLSX/PDF (+ optional JSON).
  - Audit history and change log retrieval.
- Non-functional API requirements:
  - Optimistic concurrency control (ETags/version fields).
  - Idempotent bulk updates.
  - Fine-grained authorization middleware per role and workflow state.

### 4) Risk Scoring Governance
- Define scoring model lifecycle:
  - Draft scoring definitions -> Review -> Approved and lock-to-session.
- Store calibrated S/O/D examples and rationale notes with effective dates.
- Enforce that approved baselines reference immutable scoring snapshots.
- Allow organization-level override with governance metadata (approver, reason, date).
- Provide change-impact analysis when scoring scales are updated.

### 5) Security, Auditability, and Compliance-Support Controls
- Implement least-privilege RBAC: viewer, editor, approver, admin.
- Encrypt in transit (TLS) and use secure session/token handling.
- Store full immutable audit trail for approved baselines.
- Record all sensitive operations: state changes, score updates, action closure, exports.
- Add configurable data residency and retention policy flags.

### 6) Performance and Accessibility
- Use virtualization for large table rendering and server-side pagination/filtering.
- Add asynchronous imports/exports with status tracking.
- Create index strategy for risk ranking, component hierarchy, and session queries.
- Meet WCAG-oriented targets: keyboard-first interaction, focus management, contrast, ARIA labels.

## Milestones and Timeline (Indicative 16 Weeks)

### Milestone 0 - Discovery and Definition (Weeks 1-2)
- Confirm scope, constraints, and governance requirements.
- Finalize architecture decision record and backlog.
- Define canonical TSF taxonomy starter set.
- Exit criteria:
  - Signed-off requirements and data model v1.
  - Approved UX flows and API contract draft.

### Milestone 1 - Platform Foundation (Weeks 3-5)
- Set up repo, CI/CD, environments, auth scaffolding, RBAC baseline.
- Implement project/facility hierarchy and session framework.
- Establish audit event framework and migration strategy.
- Exit criteria:
  - Users can create projects/facilities/sessions with role controls.
  - Audit events captured for core CRUD operations.

### Milestone 2 - Core FMEA Editing and Scoring (Weeks 6-9)
- Deliver high-performance spreadsheet editor and batch update APIs.
- Implement required FMEA fields, scoring models, and configurable scales.
- Add taxonomy-assisted entry and references/attachments metadata.
- Exit criteria:
  - Teams can author complete FMEA line items at scale.
  - Risk scoring works with locked model snapshots.

### Milestone 3 - Workflow, Approvals, and Traceability (Weeks 10-12)
- Add workflow transitions, review comments, approval records.
- Build traceability matrix and monitoring coverage gap views.
- Implement revision compare for baseline vs revision.
- Exit criteria:
  - End-to-end Draft -> Approved lifecycle functioning.
  - Traceability and diff views usable for review boards.

### Milestone 4 - Import/Export, Reporting, and Hardening (Weeks 13-14)
- Implement CSV/XLSX import with validation and error reporting.
- Implement PDF report generation and JSON export.
- Add templates (annual review, design change, post-incident, pre-startup, MOC).
- Exit criteria:
  - Data can be imported/exported with verifiable fidelity.
  - Printable reports align to required structure.

### Milestone 5 - UAT, Security, and Go-Live (Weeks 15-16)
- Execute test plans, fix defects, and complete performance tuning.
- Conduct role-based UAT, audit trail validation, and accessibility checks.
- Complete operational runbooks and training materials.
- Exit criteria:
  - UAT sign-off and production readiness checklist complete.

## Test Plan (Core Coverage)

### Functional Tests
- Create/edit/delete facilities, systems, components, elements.
- Create sessions and revisions; compare baselines.
- Full FMEA item CRUD including all mandatory fields.
- Scoring calculations and residual risk re-score after action completion.
- Action ownership, due dates, status transitions, evidence links.

### Permission Tests
- Viewer cannot edit data or alter workflow state.
- Editor can update draft items but cannot approve baselines.
- Approver can transition review states and sign approvals.
- Admin can modify templates, scales, and role mappings.
- Cross-project access boundaries enforced consistently.

### Audit Trail Tests
- Every create/update/delete and workflow transition logs actor and timestamp.
- Approved baseline entries cannot be tampered with.
- Export actions and bulk edits are fully traceable.
- Compare revisions reflects exact audited change sets.

### Import/Export Tests
- CSV/XLSX schema validation with clear row-level errors.
- Round-trip fidelity for core FMEA fields.
- PDF report contains required sections and metadata.
- JSON export preserves relationship identifiers.

### Performance Tests
- 5,000+ row editing with virtualization remains responsive.
- Filter/sort/pivot queries meet target latency.
- Concurrent editing conflict behavior is deterministic.

### Accessibility Tests
- Keyboard-only navigation across editor and dialogs.
- Screen reader labels for critical workflows and controls.
- Contrast and focus indicators meet enterprise accessibility targets.

## Seed Dataset Plan (TSF Embankment + Pond + Spillway)
- Components:
  - Upstream/downstream embankment zones, crest, toe drain, chimney/filter drain.
  - Decant tower and decant line, pond perimeter controls, spillway and inlet/outlet.
- Example failure mode families:
  - Overtopping, piping/internal erosion, slope instability, spillway blockage, decant structural failure.
- Example controls:
  - Freeboard limits, pond level operating envelopes, piezometer thresholds, weekly inspections, erosion protection.
- Example detection methods:
  - Piezometer trend checks, seepage flow monitoring, survey monument deformation trends, rainfall/flood alerts.
- Example actions:
  - Raise crest section, add drainage blanket, revise trigger action response plan, improve inspection frequency.

## Delivery Governance
- Cadence: weekly sprint demos + fortnightly stakeholder review.
- Artifacts: decision log, data dictionary, API spec, test evidence, release notes.
- Roles: product owner, engineering lead, dam safety SME, QA lead, security reviewer.
- Change control: scoped via backlog priorities and milestone exit criteria.

## Risks and Mitigations
- Domain complexity risk -> embed dam safety SME in backlog grooming and acceptance.
- Data quality/import risk -> strong validation + guided correction UX.
- Performance risk on large datasets -> virtualization + indexed query design early.
- Workflow contention risk -> explicit state machine and role gates.
- Adoption risk -> templates, guided scoring, and role-based onboarding.

## Initial Backlog (First 10 Stories)
1. As an admin, I can create facilities with component hierarchies.
2. As an editor, I can create a new FMEA session from a template.
3. As an editor, I can bulk-edit FMEA rows using keyboard-first interactions.
4. As an editor, I can assign S/O/D with context guidance and auto-score.
5. As an approver, I can review and approve a session baseline.
6. As a reviewer, I can compare revision changes against baseline.
7. As a user, I can view a traceability matrix from failure mode to controls and instruments.
8. As a user, I can track recommended actions and verify closure evidence.
9. As an admin, I can configure scoring scales and lock them to approved baselines.
10. As an auditor, I can inspect immutable change logs for approved sessions.
