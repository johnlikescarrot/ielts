# Privacy policy

**Effective date:** 27 September 2026

IELTS Forge is designed to operate without collecting personal data.

## What stays on your device

Cards, contexts, source links, settings, schedules, and review history are stored in Firefox's local extension storage. Shadowing recordings are represented by temporary in-memory object URLs and are discarded when the page closes or a recording is replaced.

## What is transmitted

IELTS Forge itself transmits nothing. It has no account system, backend, telemetry, advertising, crash reporter, remote AI service, or update checker beyond Firefox's normal extension mechanisms.

Opening a saved source link or the research link is an explicit navigation to that website and is governed by that site's policy. Browser-native speech synthesis may depend on voices installed or configured by the user's operating system; IELTS Forge does not select a remote provider.

## Firefox permissions

| Permission     | Why it is needed                                                                |
| -------------- | ------------------------------------------------------------------------------- |
| `storage`      | Persist cards, schedules, settings, and review history locally.                 |
| `contextMenus` | Offer “Save selection to IELTS Forge” for selected text.                        |
| `activeTab`    | Let the popup access the current tab only after the user opens it.              |
| `scripting`    | Read the active selection with a one-shot script; no persistent content script. |

IELTS Forge requests no broad host permission.

## User control

The Library can export a human-readable JSON backup and restore it later. Individual cards can be deleted. Removing the extension through Firefox removes its local extension storage according to Firefox behavior.

## Contact and changes

Questions and policy changes are tracked in the repository's GitHub issues and commit history. A change that introduces data transmission must update this policy and the Firefox data-collection declaration before release.
