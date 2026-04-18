# Prompt template: Tailings dam FMEA web application

Use the block below as a **copy-paste prompt** to brief an AI (or a product/design partner) to design and build an **online FMEA web application** for **tailings dam engineers**.

---

## Prompt (copy from here)

**Role:** You are a senior product engineer and geotechnical dam safety specialist. Design a production-quality **web application** for **Failure Modes and Effects Analysis (FMEA)** focused on **tailings storage facilities (TSFs)** and **tailings dams**.

**Primary users:** Tailings dam engineers, geotechnical engineers, dam safety officers, EOR/deputy EOR reviewers, operations supervisors, and independent reviewers/auditors.

**Regulatory and practice context (must be reflected in the UX and terminology, not legal advice):** Align workflows with common dam safety practice: hazard identification, consequence thinking, defense-in-depth, monitoring and surveillance, emergency preparedness, and documented decision records. Support both **design/construction** and **operation/maintenance** life-cycle stages.

### Product goal

Build a collaborative, auditable FMEA workspace that helps teams systematically identify **failure modes**, **mechanisms/causes**, **local and system effects**, **detection methods**, **current controls**, **recommended actions**, and **residual risk**—with traceability to **dam components**, **systems**, **instruments**, **inspection findings**, and **studies/reports**.

### Core FMEA model (minimum fields)

For each line item, support structured fields such as:

- **Asset hierarchy:** facility → dam system → structure/component (e.g., embankment zone, spillway, decant tower, liner, drainage, penstock, beach, water management) → element (filter, chimney drain, toe drain, etc.)
- **Function / performance intent** (what must remain true for safety and stability)
- **Failure mode** (what can go wrong)
- **Failure mechanism / cause** (why it happens; include initiating events where relevant)
- **Effect** (local effect, upstream/downstream consequence categories; support “no credible pathway” rationale when applicable)
- **Severity (S)**, **Occurrence/likelihood (O)**, **Detection (D)** with **calibrated scales** tailored to tailings dams (editable scale definitions and examples)
- **Risk Priority Number (RPN)** or preferred alternative scoring if the team uses qualitative risk matrices—make scoring method configurable
- **Current controls** (design features, redundancy, monitoring, inspections, maintenance, alarms, operating limits)
- **Detection method** tied to **instrument tags**, **inspection checklists**, or **SCADA/alarm logic** where relevant
- **Recommended actions** with owner, due date, status, verification evidence links
- **Residual risk** after actions (re-score)
- **References:** drawing IDs, study IDs, OMS sections, incident/near-miss IDs, audit findings

### Tailings-dam-specific libraries (seed content + user extensibility)

Provide starter taxonomies users can extend:

- **Common failure mode families:** overtopping, internal erosion/piping, slope instability, static/seismic liquefaction, foundation weakness, filter incompatibility, cracking, settlement, clogging, decant structural failure, liner leakage, uncontrolled pond rise, poor beach management, freeze-thaw, animal burrows, vegetation issues, spillway blockage, flood loading, rapid drawdown, construction defects, operational deviations, etc.
- **Surveillance categories:** visual inspections, survey monuments, piezometers, inclinometers, flow/weirs, seepage collection, LiDAR/UAV trends, thermistors, seismic monitoring, water balance checks, etc.
- **Consequence framing:** credible release scenarios, downstream exposure concepts (high-level categories only unless the org provides methodology)

### Application features (must-have)

- **Projects / facilities** with role-based access (viewer, editor, approver, admin)
- **Versioned FMEA sessions** (baseline vs revision; change log; compare revisions)
- **Workflow states:** Draft → In review → Approved → Superseded; electronic sign-off optional
- **Import/export:** CSV/XLSX; optional JSON for integrations
- **Filtering and pivot views:** by component, by risk rank, by action status, by monitoring coverage gaps
- **Traceability matrix:** failure mode ↔ controls ↔ instruments ↔ actions
- **Attachments/links** to evidence (controlled URLs or file metadata fields)
- **Audit trail:** who changed what and when; immutable history for approved baselines

### UX requirements

- Fast table editing (spreadsheet-like), keyboard navigation, bulk edit
- Clear guidance panels explaining how to score S/O/D for dams
- Templates for **annual surveillance review**, **design change**, **post-incident**, **pre-startup**, **MOC (management of change)**
- Printable **report view** with organization logo fields and standard sections

### Non-functional requirements

- Security: authentication, authorization, least privilege, encrypted transport, secure session handling
- Data residency notes as configurable assumptions
- Performance: thousands of FMEA rows without lag; pagination/virtualization
- Accessibility: WCAG-oriented targets for enterprise procurement

### Deliverables from you (the AI)

1. **Information architecture** and **data schema** (entities/relationships).
2. **Key screens** with wireframe-level descriptions.
3. **API outline** (REST or GraphQL) for CRUD, versioning, approvals, import/export.
4. **Risk scoring governance** (how scales are defined, documented, and locked per approved baseline).
5. **Implementation plan** with milestones and test cases (including permission tests and audit trail tests).
6. **Starter seed datasets** (components, example failure modes, example controls) appropriate for a TSF embankment with pond and spillway.

**Constraints:** Do not present legal compliance as guaranteed. Use industry-standard language and configurable fields so each organization can map to its own standards and governance.

**Tech stack preference (optional—fill in):** _[e.g., React + Node + Postgres, or Django + Postgres, or internal stack]_

**Output format:** Start with assumptions and questions (max 8), then proceed with the deliverables.

---

## File purpose

This document holds the **master prompt** for generating specifications and implementation guidance for a tailings-dam-oriented FMEA web application. Edit the optional tech stack line before use.
