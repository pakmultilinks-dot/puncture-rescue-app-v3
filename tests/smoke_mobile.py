#!/usr/bin/env python3
"""Mobile-sized browser checks and review screenshots for the local v3 demo."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os
from threading import Thread

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / "screenshots"
BASE_URL = os.environ.get("APP_BASE_URL", "")


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass


def mobile_context(browser):
    return browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=1,
        is_mobile=True,
        has_touch=True,
    )


def mock_location_permission(page, state):
    """Mock only browser location APIs so permission cases are repeatable and local."""
    script = """(() => {
          const simulatedState = __SIMULATED_STATE__;
          window.__locationAudit = { permissionChecks: 0, positionReads: 0 };
          Object.defineProperty(navigator, 'permissions', {
            configurable: true,
            value: { query: async ({ name }) => {
              if (name === 'geolocation') window.__locationAudit.permissionChecks += 1;
              return { state: simulatedState };
            } }
          });
          Object.defineProperty(navigator, 'geolocation', {
            configurable: true,
            value: {
              getCurrentPosition: (success, error) => {
                window.__locationAudit.positionReads += 1;
                if (simulatedState === 'granted') {
                  success({ coords: { latitude: 0, longitude: 0, altitude: null, accuracy: 100, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() });
                } else {
                  error({ code: 1, message: 'Permission denied' });
                }
              },
              watchPosition: () => 1,
              clearWatch: () => {}
            }
          });
        })();""".replace("__SIMULATED_STATE__", json.dumps(state))
    page.add_init_script(script)


def start_app(page):
    page.goto(BASE_URL, wait_until="networkidle")
    expect(page.get_by_text("PATCHLANE", exact=True)).to_be_visible()
    expect(page.get_by_text("Flat tyre?", exact=False)).to_be_visible()


def manual_search(page, area="Central demo zone"):
    page.get_by_role("button", name="Enter an area or landmark instead").click()
    page.get_by_label("Area or landmark").fill(area)
    page.get_by_role("button", name="Show sample mechanics").click()


def assert_visible_button_targets(page, minimum=48):
    for element in page.get_by_role("button").all():
        if element.is_visible():
            height = element.evaluate("el => el.getBoundingClientRect().height")
            label = element.get_attribute("aria-label") or element.inner_text()
            assert height >= minimum, f"{label!r} target is {height:.1f}px tall"


def test_puncture_only_start_and_one_tap_location(browser):
    context = mobile_context(browser)
    page = context.new_page()
    mock_location_permission(page, "granted")
    external_requests = []
    page.on("request", lambda req: external_requests.append(req.url) if not req.url.startswith(BASE_URL) else None)
    start_app(page)
    expect(page.get_by_role("button", name="Find puncture help using one-time location consent")).to_be_visible()
    body = page.locator("body").inner_text().lower()
    for forbidden in ("tow truck", "breakdown", "fuel delivery", "battery service", "repair categories"):
        assert forbidden not in body, f"peripheral feature leaked into the rider flow: {forbidden}"
    assert page.evaluate("window.__locationAudit.permissionChecks") == 0, "location was checked before the tap"
    assert_visible_button_targets(page)
    page.screenshot(path=str(SCREENSHOTS / "01-rider-search-start-390x844.png"))
    page.get_by_role("button", name="Find puncture help using one-time location consent").click()
    expect(page.get_by_text("Nearby mechanics", exact=True)).to_be_visible(timeout=10000)
    assert page.evaluate("window.__locationAudit.permissionChecks") == 1
    assert page.evaluate("window.__locationAudit.positionReads") == 1
    expect(page.get_by_text("not real or location-matched", exact=False)).to_be_visible()
    assert external_requests == [], f"unexpected external requests: {external_requests}"
    assert_visible_button_targets(page)
    context.close()


def test_denied_location_manual_fallback_and_results(browser):
    context = mobile_context(browser)
    page = context.new_page()
    mock_location_permission(page, "denied")
    start_app(page)
    assert page.evaluate("window.__locationAudit.permissionChecks") == 0
    page.get_by_role("button", name="Find puncture help using one-time location consent").click()
    expect(page.get_by_text("Location was not allowed.", exact=False).first).to_be_visible()
    expect(page.get_by_label("Area or landmark")).to_be_visible()
    assert page.evaluate("window.__locationAudit.permissionChecks") == 1
    assert page.evaluate("window.__locationAudit.positionReads") == 0
    assert_visible_button_targets(page)
    page.screenshot(path=str(SCREENSHOTS / "02-location-denied-manual-fallback-390x844.png"))
    page.get_by_label("Area or landmark").fill("Central demo zone")
    page.get_by_role("button", name="Show sample mechanics").click()
    expect(page.get_by_text("Nearby mechanics", exact=True)).to_be_visible()
    expect(page.get_by_text("Puncture Helper 08", exact=True)).to_be_visible()
    page.screenshot(path=str(SCREENSHOTS / "03-nearby-mechanics-390x844.png"))
    assert_visible_button_targets(page)
    context.close()


def test_no_results_recovery(browser):
    context = mobile_context(browser)
    page = context.new_page()
    start_app(page)
    manual_search(page, "Harbor demo zone")
    expect(page.get_by_text("No sample mechanics here.", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Change area")).to_be_visible()
    assert_visible_button_targets(page)
    page.screenshot(path=str(SCREENSHOTS / "06-no-results-390x844.png"))
    page.get_by_role("button", name="Change area").click()
    expect(page.get_by_label("Area or landmark")).to_be_visible()
    context.close()


def test_profile_call_request_cancel_simulation(browser):
    context = mobile_context(browser)
    page = context.new_page()
    external_requests = []
    page.on("request", lambda req: external_requests.append(req.url) if not req.url.startswith(BASE_URL) else None)
    start_app(page)
    manual_search(page)
    page.get_by_role("button", name="View Puncture Helper 08").click()
    expect(page.get_by_text("SAMPLE MECHANIC", exact=True)).to_be_visible()
    expect(page.get_by_text("AVAILABILITY · FICTIONAL", exact=True)).to_be_visible()
    assert_visible_button_targets(page)
    page.screenshot(path=str(SCREENSHOTS / "04-mechanic-profile-390x844.png"))
    page.get_by_role("button", name="Call mechanic · demo").click()
    expect(page.get_by_text("No number was dialled", exact=False)).to_be_visible()
    page.get_by_role("button", name="Request puncture help").click()
    expect(page.get_by_text("No request was sent.", exact=True)).to_be_visible()
    expect(page.get_by_text("Waiting for a reply · simulated", exact=True)).to_be_visible()
    assert_visible_button_targets(page)
    page.screenshot(path=str(SCREENSHOTS / "05-request-status-cancel-preview-390x844.png"))
    page.get_by_role("button", name="Cancel request preview").click()
    expect(page.get_by_text("Cancelled · preview only", exact=True)).to_be_visible()
    expect(page.get_by_text("Nothing was sent or shared", exact=False)).to_be_visible()
    assert external_requests == [], f"unexpected external requests: {external_requests}"
    context.close()


def test_unified_signup_validation_and_preview(browser):
    context = mobile_context(browser)
    page = context.new_page()
    start_app(page)
    page.get_by_role("button", name="Mechanic? Create a sample listing").click()
    expect(page.get_by_text("Create a sample listing", exact=True)).to_be_visible()
    inputs = page.get_by_role("textbox").all()
    assert len(inputs) == 3, f"expected one unified name/contact/area form, got {len(inputs)} fields"
    body = page.locator("body").inner_text().lower()
    for forbidden in ("provider type", "independent", "shop signup", "service category", "choose your role"):
        assert forbidden not in body, f"separate provider path or chooser found: {forbidden}"
    assert_visible_button_targets(page)
    page.screenshot(path=str(SCREENSHOTS / "07-unified-mechanic-signup-390x844.png"))
    page.get_by_role("button", name="Preview sample listing").click()
    expect(page.get_by_text("Enter at least two characters.", exact=True)).to_be_visible()
    expect(page.get_by_text("Enter 10 fictional digits", exact=False).first).to_be_visible()
    expect(page.get_by_text("Enter a sample area.", exact=True)).to_be_visible()
    page.get_by_label("Name riders will see").fill("Sample Mechanic 21")
    page.get_by_label("Contact number · fictional").fill("0000000000")
    page.get_by_label("Sample coverage area").fill("West demo zone")
    page.get_by_role("button", name="Preview sample listing").click()
    expect(page.get_by_text("PREVIEW ONLY", exact=True)).to_be_visible()
    expect(page.get_by_text("No listing created.", exact=False)).to_be_visible()
    context.close()


def test_responsive_widths_and_touch_targets(browser):
    context = mobile_context(browser)
    page = context.new_page()
    for width in (360, 390, 430, 768):
        page.set_viewport_size({"width": width, "height": 844})
        start_app(page)
        manual_search(page)
        expect(page.get_by_text("Nearby mechanics", exact=True)).to_be_visible()
        document_width = page.locator("html").evaluate("el => el.scrollWidth")
        assert document_width <= width, f"horizontal overflow at {width}px: {document_width}px"
        assert_visible_button_targets(page)
        page.goto(BASE_URL, wait_until="networkidle")
    context.close()


def main():
    global BASE_URL
    SCREENSHOTS.mkdir(exist_ok=True)
    server = None
    if not BASE_URL:
        if not (ROOT / "dist" / "index.html").exists():
            raise SystemExit("Web export is missing; run `npm run build:web` first.")
        server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT / "dist")))
        Thread(target=server.serve_forever, daemon=True).start()
        BASE_URL = f"http://127.0.0.1:{server.server_port}"
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                headless=True,
                executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            checks = [
                ("puncture-only start and one-tap location behavior", test_puncture_only_start_and_one_tap_location),
                ("denied location, manual fallback and synthetic results", test_denied_location_manual_fallback_and_results),
                ("no-results state and recovery", test_no_results_recovery),
                ("focused profile, simulated call, request and cancel", test_profile_call_request_cancel_simulation),
                ("unified mechanic signup validation and preview", test_unified_signup_validation_and_preview),
                ("responsive widths and 48px touch targets", test_responsive_widths_and_touch_targets),
            ]
            failures = []
            for name, test in checks:
                try:
                    test(browser)
                    print(f"PASS  {name}")
                except Exception as error:
                    failures.append((name, error))
                    print(f"FAIL  {name}: {type(error).__name__}: {error}")
            browser.close()
            if failures:
                raise SystemExit(1)
            print(f"Screenshots written to {SCREENSHOTS}")
    finally:
        if server:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    main()
