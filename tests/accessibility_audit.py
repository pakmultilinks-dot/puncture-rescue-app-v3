#!/usr/bin/env python3
"""Check the fixed v3 foreground/background pairs against WCAG AA for normal text."""


def luminance(hex_color):
    channels = [int(hex_color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in channels]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast(foreground, background):
    light, dark = sorted((luminance(foreground), luminance(background)), reverse=True)
    return (light + 0.05) / (dark + 0.05)


PAIRS = [
    ("white button text / primary blue", "#FFFFFF", "#3855F6"),
    ("ink text / lime accent", "#111827", "#D5F34A"),
    ("muted copy / app paper", "#4F5B70", "#F2F4F8"),
    ("muted copy / white card", "#4F5B70", "#FFFFFF"),
    ("small muted label / white card", "#657187", "#FFFFFF"),
    ("white text / dark button", "#FFFFFF", "#111827"),
    ("alert text / alert notice", "#8C2F24", "#FFF0EC"),
    ("success text / success notice", "#205B45", "#E8F6EF"),
    ("blue link / soft-blue surface", "#233AC5", "#E9EDFF"),
    ("dark text / soft-blue surface", "#263247", "#E9EDFF"),
]


def main():
    failures = []
    ratios = []
    for label, foreground, background in PAIRS:
        value = contrast(foreground, background)
        ratios.append(value)
        result = "PASS" if value >= 4.5 else "FAIL"
        print(f"{result}  {value:.2f}:1  {label}")
        if value < 4.5:
            failures.append(label)
    print(f"Minimum audited contrast: {min(ratios):.2f}:1 (WCAG AA normal-text threshold: 4.50:1)")
    if failures:
        raise SystemExit(f"Contrast threshold failed: {', '.join(failures)}")


if __name__ == "__main__":
    main()
