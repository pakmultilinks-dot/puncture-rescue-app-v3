# System design

## Current prototype

Patchlane v3 is a single Expo/React Native client exported for local web review. Its screen state is `home → results → profile → request`, with one separate shared `signup` preview. All sample records and form values live only in component memory. There is no API, database, real provider directory, account, live map, dialer, contact access, request dispatch, notification or payment integration.

### Rider path

1. The home screen states that the prototype is for motorcycle punctures and presents one primary action: **Find puncture help**. The one-time foreground location behavior is explained beside the action.
2. Only tapping that action invokes Expo foreground permission and, when granted, one current-position read. The app does not inspect, retain or send the returned coordinates. If access is denied or the API fails, the app opens the area/landmark fallback. No background location is requested.
3. Results come from a hard-coded fictional sample set selected by the typed sample area or a fixed demo area. Names, area labels, distances, availability and arrival windows are synthetic; the results notice says they are neither real nor matched to the device's location.
4. A profile contains only puncture-help details and two simulated actions. The call action displays a notice and does not dial or contact anyone. The request screen previews a local waiting/cancelled status without sharing location or sending a request.

### Unified mechanic preview

The separate listing preview uses one field for the name riders will see, plus fictional contact and coverage fields. There is no provider-type chooser, type-specific form, service-category selector, signup backend or persistent profile. Validation and preview status are held in memory and discarded when the screen is left.

## Future production boundary

A live service would require a separately reviewed client and backend, a consented and minimized location-search design, a verified listing registry, explicit provider availability, transparent distance/time estimate semantics, request acceptance/cancellation lifecycle, contact protection, retention/deletion controls and operational support. None of these are implemented or provisioned. A future service must not present synthetic samples as live mechanics or contact anyone without a clear rider action and provider-side handling.
