# Security policy

## Supported version

The latest release on the default branch receives security fixes.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature for this repository. Do not include private study data, recordings, page selections, or credentials in a report.

A useful report includes the affected version, Firefox version, reproduction steps, impact, and a minimal proof of concept. Maintainers should acknowledge a report within seven days and coordinate disclosure after a fix is available.

## Security model

Bandcraft:

- requests no host permissions;
- reads page selection only after explicit user activation;
- declares no collection or transmission of user data;
- does not execute remote code;
- relies on Firefox-managed extension storage;
- keeps imported audio and recordings in local Blob URLs for the current session;
- uses a restrictive extension-page content security policy.

The readable JSON backup may contain learner writing, captured text, source URLs, and study history. Users should protect exported files as they would protect personal notes.
