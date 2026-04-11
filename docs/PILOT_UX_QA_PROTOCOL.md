# Pilot UX + Browser QA Protocol

This protocol prioritizes the pilot user journey:
`Home -> Private entry -> Login clarity -> First successful private workspace task`.

## 1) Browser Smoke Checklist

Use Playwright smoke tests plus manual confirmation on deployed domains.

### `whetiq.com`
- Home loads with both primary entry points visible.
- `Open Demo Workspace` routes to `/workspace` without OAuth.
- `Sign In for Private Workspace` routes to `/login?callbackUrl=%2Fprivate-workspace`.
- Login screen renders only configured provider buttons.
- Missing provider config shows setup guidance and no crash page.

### `admin.whetiq.com`
- Admin login shell renders.
- Provider buttons match `/api/auth/providers`.
- OAuth button click does not produce black-screen "Server error".

## 2) UX Audit Tags

Tag each questionable element as one of:
- `Remove now`: filler/placeholder with no user value.
- `Rewrite now`: useful intent but confusing copy or interaction.
- `Keep later`: non-critical but acceptable for current pilot stage.

## 3) Current Pilot-First Findings

| Area | Tag | Finding | Recommendation |
|---|---|---|---|
| Web workspace side content | Remove now | Placeholder side rails and non-functional navigation reduce trust. | Keep launch view focused on real conversation and response output only. |
| Login flow | Rewrite now | Config failures can feel like product failure instead of setup issue. | Show explicit auth configuration guidance on login when `error=config`. |
| OAuth button availability | Remove now | Showing unavailable providers causes dead-end interactions. | Render buttons from runtime provider discovery only. |
| Landing private CTA | Rewrite now | CTA intent can be ambiguous when auth mode changes by environment. | Keep a stable private CTA and explicit callback target `/private-workspace`. |
| Demo vs private boundary | Keep later | Split is now technically correct but still needs visual differentiation polish. | Add clearer visual badges and small explainer panel after pilot stabilization. |

## 4) Top 5 UX Fixes by Impact

1. Keep private login deterministic and non-crashing even with partial auth config.
2. Remove unavailable OAuth options from the UI.
3. Keep workspace empty-state and guidance focused on first real task completion.
4. Maintain a clear, stable route contract: demo `/workspace`, private `/private-workspace`.
5. Use smoke-test evidence (screenshots/traces) for each release before announcing pilot availability.

## 5) Run Report Template

Use this format after each smoke run:

```md
## Browser QA Report (date)

### Scope
- Domains:
- Commit:
- Environment:

### Pass/Fail Matrix
- web: landing/demo/private-entry:
- web: login provider handling:
- admin: login shell:
- admin: provider mapping:

### Blocking Defects
- [severity] summary + repro URL/path

### UX Findings
- Remove now:
- Rewrite now:
- Keep later:

### Artifacts
- Playwright HTML report:
- Screenshot/trace links:
```
