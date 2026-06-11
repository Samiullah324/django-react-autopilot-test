# Task Context — #17 Add SUPPORT.md

## Scope

Create a short top-level `SUPPORT.md` explaining how users can get help and report issues. Markdown only, under 30 lines. Do not modify existing source files.

## Implementation decisions

- Placed `SUPPORT.md` at the repository root alongside `README.md`.
- Linked to GitHub Issues and Discussions for the `Samiullah324/django-react-autopilot-test` repository (URLs match `README.md`).
- Pointed documentation readers to `README.md` and the interactive OpenAPI docs at `/api/docs/` (mentioned in README).
- Included a "Community Guidelines" subsection under its own heading to satisfy the spec's guideline requirement while keeping the structure scannable.

## Files changed

| File | Why |
|------|-----|
| `SUPPORT.md` | New support guide for users (task deliverable). |
| `TASK_CONTEXT.md` | Branch context for resuming or reassigning this ticket. |

## Open questions / follow-ups

- None. If GitHub Discussions is not enabled on the repo, maintainers may want to enable it or remove that link.

## Verification

- `SUPPORT.md` is under 30 lines.
- No existing source files were modified.
- Backend tests: `python3 manage.py test inventory.tests`
