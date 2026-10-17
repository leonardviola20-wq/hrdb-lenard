---
title: Contacts Cards Address
lane: doing
created: 2026-10-17T18:12:00+08:00
updated: 2026-10-17T18:12:00+08:00
description: Display each contact's saved address directly on its Contacts page card.
---

## Conversation

### user

Contacts Page > show the address in the Cards

### agent

Added each contact's full address below the phone number in its card. Multi-line and long addresses wrap; missing values show “Address not set”. The existing details dialog and contact data behavior were unchanged.

Validation: focused ESLint passes with three pre-existing `<img>` optimization warnings; `git diff --check` passes.

### user
