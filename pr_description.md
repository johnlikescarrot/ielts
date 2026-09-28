🧪 Add tests for passive voice detection logic

🎯 **What:** The testing gap addressed
The passive voice logic for detecting irregular passive auxiliary (`parseClauses`) was previously untested when a passive auxiliary was missing and when it was present with an irregular passive participle (like "was drawn").

📊 **Coverage:** What scenarios are now tested
- Added a test to verify that an irregular passive participle without an auxiliary ("I drawn a picture...") is correctly not flagged as passive.
- Added a test to verify that the same participle with a valid auxiliary ("The map was drawn...") is successfully detected as passive.

✨ **Result:** The improvement in test coverage
Test coverage is improved for passive auxiliary detection functionality in `astParser.ts`.
