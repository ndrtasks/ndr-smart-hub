# Architecture

## Core domains
- Identity: Employee, Manager, Admin, Department.
- Knowledge: Policy, Procedure, Guide, Form, Version, Access scope.
- Service Catalog: Department -> Service -> Procedure -> Form -> Requirements -> Attachments -> Submission Mode.
- Workflow: Request -> Steps -> Approvers -> Return/Reject/Approve -> Audit Log.
- AI Orchestrator: intent routing, retrieval, structured questions, next action. AI never bypasses permission checks or creates unsupported policy facts.

## Submission modes
- PORTAL_ONLY
- FORM_PORTAL
- FORM_WORKFLOW
- INFO_ONLY

## AI resilience
Provider adapter:
- GeminiProvider (planned free-tier pilot)
- Future OpenAIProvider
- LocalFallbackRouter

If provider fails, manual browsing and workflows continue.

## Security baseline
- Authentication required.
- RBAC + resource-level authorization.
- Private file storage.
- Signed/temporary download URLs.
- Server-side provider keys only.
- Audit events for requests, approvals, files, and document versions.
- Do not send full employee database to AI.
- Deny access to another employee's request by ID guessing.

## Deployment strategy
Development/Demo can use free tiers. Production launch must be re-evaluated for organizational licensing, usage limits, storage, email volume, and hosting terms.
