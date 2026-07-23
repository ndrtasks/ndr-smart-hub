# NDR Smart Hub — Phase 8

## Approval Workflow Designer
- Approval route can be configured per form/service and per requester department.
- A default route can be configured for all departments, then overridden for a specific department.
- Supported route targets:
  - employee direct manager/supervisor
  - requester department manager
  - general manager
  - named employee
  - manager of a specific department
  - a role inside requester department
  - a role inside a specific department
  - assigned HR reviewer
- Stages are ordered visually and can be moved up/down.
- Last stage is displayed as final approval.
- Existing requests keep their captured route; route edits affect newly created requests only.
- Current-stage-only notification logic remains unchanged.

## Organization & Accounts
- Add employees, supervisors and managers from the UI.
- Edit employee name, email, title, department, role, direct manager/supervisor, joining date and housing allowance.
- Move employees between departments.
- Activate/deactivate accounts.
- Hard delete only when an account has no historical or operational references.
- Prevent deactivation when the employee is a current approver, department manager, active delegate, or explicitly referenced by an approval template.
- Add/edit departments and define primary department manager.
- Temporary delegations remain supported.

## Housing Phase 7 included
- Employee selects an eligible ceiling based on service duration.
- Employee enters the actual requested amount.
- Requests above the calculated ceiling are blocked.
- Estimated installment and remaining ceiling are calculated.

## Demo persistence
This static pilot stores directory and workflow configuration in browser localStorage. Production should move these records to the authenticated backend/database so changes are shared across all users and devices.
