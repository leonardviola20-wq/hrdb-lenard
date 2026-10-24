---
title: SSS Reports Workflow
lane: todo
created: 2026-10-21T09:28:00+08:00
updated: 2026-10-21T09:28:00+08:00
description: Investigate missing saved drafts in SSS Loan Reports and agree on the expected employer scope before implementation.
---

## Conversation

### user

Keep drafts scoped to the page Employer and prevent or avoid changing Employers in the form.

### agent

Conversing in file: task_20261021_sssreportsworkflow.md

Plan confirmed: SSS report drafts should remain scoped to the Employer selected on the Reports page. Keep the form Employer aligned with that context so a draft cannot be saved under a different Employer and then disappear from the page's Saved Drafts list. Preserve the existing report-kind filter, draft claim/release behavior, and refresh after saving. During implementation, validate both Contribution and Loan draft save/list behavior and run the focused project checks. The working tree already contains unrelated and report-related edits; implementation must preserve those changes.

### user

SSS Reports
Loan Reports
Saved Drafts missing after saving drafts

### agent

Conversing in file: task_20261021_sssreportsworkflow.md

Plan: trace the SSS Loan Report draft lifecycle from the form through the save endpoint, list endpoint, and Saved Drafts menu. The current implementation saves the draft with the Employer selected in the form, but fetches and displays drafts scoped to the employer in the page URL. If those employer IDs differ, a successful save can be hidden by the current list filter. If they match, the save path refreshes the draft list after releasing the draft claim, so that path should show it.

Before implementation, confirm the desired behavior when a draft is saved with a different Employer than the one in the Reports page URL:

1. Keep drafts scoped to the page Employer and prevent/avoid switching Employers in the form.
2. Keep the current form behavior, but show drafts for all Employers on the page.
3. Keep drafts scoped, but switch the page Employer to the saved draft's Employer after saving.

No application code has been changed during this planning phase.

### user
