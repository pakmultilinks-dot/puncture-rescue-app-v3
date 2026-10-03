# Patchlane v3 — puncture-help concept

Patchlane v3 is a local-only mobile prototype for one job: helping a motorcyclist preview fictional puncture mechanics. It is a review build, not a live service or a production-ready roadside tool. The rider flow asks for location only after the rider taps **Find puncture help**; it checks once in the foreground, does not use or transmit coordinates, and falls back to a typed area or landmark if permission is denied or unavailable. Nearby names, areas, distances, availability and arrival estimates are invented. Calls, requests, cancellation and provider listing are screen-only simulations.

> **Dependency warning:** the saved npm audit report in [`dependency-audit.json`](./dependency-audit.json) records **23 advisories: 16 high, 7 moderate, and 0 critical**. The dependency tree has not been upgraded as part of this prototype review. This app is not suitable for production or real roadside use.

This revision keeps v2's ink, electric-blue and lime palette while removing the static map, non-puncture options, provider-type split and explanatory panels that slowed the next rider action. A single shared listing form has one rider-facing name field; there is no person/shop selector or separate onboarding path.

## Run and verify

```bash
npm install
npm run web          # local Expo web preview
npm run check        # TypeScript
npm run build:web    # static web export to dist/
python3 tests/accessibility_audit.py
npm test             # export plus mobile-sized browser checks and screenshots
```

The automated browser suite uses local Chromium at 390 × 844 CSS pixels for captures and checks responsive widths of 360, 390, 430 and 768 pixels. It mocks browser location permission states for repeatability; this is not native-device testing. No iOS simulator, Android emulator or physical device was used in the recorded checks. The contrast audit checks 10 selected foreground/background pairs against WCAG AA normal-text contrast; it does not constitute a full accessibility certification.

## Android preview build

[`eas.json`](./eas.json) defines a `preview` profile for an internally distributed Android APK. After signing in to an Expo account, build it with:

```bash
npx eas-cli@latest build --platform android --profile preview
```

EAS Build provides an install link for the APK; this is a tester preview, not an app-store release. Installing an APK may require accepting Android's warning for apps installed outside the Play Store. The app's native-device behavior has not been verified by the local browser tests.

## Review screenshots

Every capture is **390 × 844 px** and is produced from the local export:

- [Rider start — immediate puncture action](./screenshots/01-rider-search-start-390x844.png)
- [Location denied — manual area fallback](./screenshots/02-location-denied-manual-fallback-390x844.png)
- [Nearby synthetic mechanics](./screenshots/03-nearby-mechanics-390x844.png)
- [Focused mechanic profile](./screenshots/04-mechanic-profile-390x844.png)
- [Request status and cancel preview](./screenshots/05-request-status-cancel-preview-390x844.png)
- [No-results recovery](./screenshots/06-no-results-390x844.png)
- [Unified mechanic listing form](./screenshots/07-unified-mechanic-signup-390x844.png)

## Project boundaries

- **Only rider task:** motorcycle puncture help. There are no other assistance or repair categories.
- **Location:** a single foreground check follows the explicit button tap. The app does not save or send a location; synthetic results are not matched to coordinates.
- **No live integrations:** no provider database, backend, maps, dialer, contacts, messaging, request dispatch, notifications, accounts, payment or profile registration is connected.
- **Fictional inputs:** use invented names, areas and all-zero sample contact numbers in the provider preview. Nothing is retained after the screen session or transmitted.
- **Review only:** the screenshots and automated checks exercise a local prototype with mocked browser permissions. The app has no real provider coverage or live service behavior.

See [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md), [RESEARCH_NOTES.md](./RESEARCH_NOTES.md), [TEST_REPORT.md](./TEST_REPORT.md) and [`dependency-audit.json`](./dependency-audit.json) for implementation boundaries, evidence limits, executed checks and dependency findings.
