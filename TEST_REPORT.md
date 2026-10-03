# Test report

**Run date:** 2026-10-03. **Target:** local Expo/React Native web export for Patchlane v3. No live provider, account, backend, map, dialer, messaging, request, notification, payment or publishing service was connected.

## Results

- `npm run build:web` — passed; Expo exported the v3 web app to `dist/`.
- `npm test` — passed; it rebuilt the web export and passed all six mobile browser groups.
- `npm run check` — passed (`tsc --noEmit`).
- `python3 -m py_compile tests/smoke_mobile.py tests/accessibility_audit.py` — passed.
- `python3 tests/accessibility_audit.py` — all 10 audited foreground/background pairs passed WCAG AA normal-text contrast; the lowest ratio was **4.92:1**.

The six browser groups verified the puncture-only start and that no location permission check occurs before the button tap; one mocked granted, one-time location check; denied-location manual fallback; synthetic results and the no-results recovery; mechanic profile with call/request/cancel simulations and no outgoing external requests; and unified listing form validation/preview with no provider-type chooser or alternate signup path. Responsive screens at 360, 390, 430 and 768 px had no horizontal overflow. Every visible button checked on home, denied fallback, results, no-results, profile, request and signup was at least **48 px** tall.

The in-app browser also opened the fresh temporary review origin and confirmed the list/profile/request path, the “no number was dialled” call message, and the local cancelled-preview state. That temporary QA server was stopped after verification; the app was not published or deployed.

Seven screenshots were regenerated, visually inspected for crop/clipping and verified as **390 × 844 px**: rider start, denied-location fallback, nearby mechanics, mechanic profile, request status/cancel preview, no-results recovery and unified mechanic listing. The tests mock browser geolocation permission responses, so they validate the app path without reading or transmitting a real coordinate.

## Limits and dependency advisories

No iOS simulator, Android emulator or physical device was used. Native permission prompts and native-device behavior have **not** been tested.

`npm audit` reported **23 advisories: 16 high, 7 moderate, 0 critical**. `npm audit --omit=dev` returned the same totals. Findings include direct Expo and React Native packages plus Expo CLI/config/Metro dependency chains; transitive notices include `node-forge`, `braces`/`micromatch`, `uuid` and `xcode`. Because resolution requires compatibility review against the Expo/React Native SDK versions, no broad automatic upgrade was applied. Review the advisories and plan targeted, SDK-compatible updates before any production use.

No live location was requested during verification. No public deployment, Expo publication, GitHub push, account, provider contact or real-data test was performed.
