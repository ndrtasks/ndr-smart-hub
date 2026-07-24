# NDR Smart Hub — Knowledge Assistant Redesign

## Goal
Transform the platform from an approval-first workflow prototype into an employee knowledge assistant that reads HR procedures and forms, answers employee questions from those sources, identifies the correct form, and helps complete it.

## Core employee experience
1. Employee asks a natural-language question, for example: "كيف أقدم إجازة؟"
2. Assistant retrieves the relevant HR procedure and form.
3. Assistant explains the steps in plain Arabic/English based only on the available source documents.
4. Assistant shows the exact source document reference, revision/version and related form.
5. Assistant offers two actions:
   - Open / fill the form manually.
   - Let the assistant prepare the form.
6. For assisted filling, the platform pre-fills known employee data and asks only for missing required fields.
7. The employee reviews a completed draft before exporting/printing/sending it.

## Knowledge rules
- Answers must be grounded in the uploaded HR procedures, forms and approved internal references.
- Never invent a policy, entitlement, approval path, form number or requirement.
- When the available source is old or temporary, clearly label it as a pilot/temporary source.
- If the answer is not found in the available sources, say that the information is not available instead of guessing.
- Always show the source document title/code and revision when available.
- Prefer the newest active source for the same document code.

## Form assistance
Each form will have:
- form code and title
- source file path
- related procedure code
- required fields
- optional fields
- employee-profile fields that can be auto-filled
- conditional fields
- required attachments

Assisted filling should:
- auto-fill employee name, employee ID, department, job title and other known profile data
- ask only for missing information
- explain why a field is needed when useful
- produce a reviewable draft
- never submit or approve on behalf of the employee without an explicit future workflow feature

## Phase 1 scope
- Knowledge Q&A
- Procedure explanation
- Related-form recommendation
- Open/download source form
- Guided form filling
- Draft preview
- Source/version display
- Arabic and English

## Out of scope for Phase 1
- Approval routing
- Odoo synchronization
- production authentication
- final electronic approvals

The existing approval/workflow implementation is preserved in a backup branch and must not be deleted.
