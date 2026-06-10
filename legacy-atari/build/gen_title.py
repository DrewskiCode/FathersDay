#!/usr/bin/env python3
"""
Full-screen monitor + centered fire (CTRLPF_DEFAULT mirrored playfield).

Mirror math on the 40-px playfield: authored bit i also appears at bit (39-i).
  - Bits 0-3  -> far-left / far-right outer bezel (ONE frame)
  - Bits 17-19 -> near CENTER (never use for sides — causes twin pillars)
  - Fire + inner bezel must be PALINDROME: bit i set iff bit (19-i) set

Use symmetric span (lo, hi) where lo + hi == 19.
"""

LINES = 192

CF = 0x4A   # salmon screen interior
CB = 0x04   # dark grey bezel (high contrast on salmon)
FY = 0x1C
FO = 0x26
FR = 0x32

OUTER = 5       # outer bezel cols 0..4 (mirror -> far-right frame)
INNER_L = 5     # inner screen edge; 5+14=19, 6+13=19 (double line)
INNER_R = 14
TOP_ROWS = 18
BOT_ROWS = 16
STAND_ROWS = 8
FIRE_START = 62
FIRE_ROWS = 40


def encode20(bits20):
    pf0 = pf1 = pf2 = 0
    for i, b in enumerate(bits20):
        if b != "1":
            continue
        if i < 4:
            pf0 |= 1 << (3 - i)
        elif i < 12:
            pf1 |= 1 << (11 - i)
        else:
            pf2 |= 1 << (19 - i)
    return pf0, pf1, pf2


def blank():
    return ["0"] * 20


def sym_set(row, lo, hi=None):
    """Set palindrome span lo..hi where hi defaults to 19-lo."""
    if hi is None:
        hi = 19 - lo
    for x in range(lo, hi + 1):
        if 0 <= x < 20:
            row[x] = "1"


def top_bottom_bar():
    row = blank()
    sym_set(row, 0, 19)
    return row


def side_bezel():
    """Outer + double inner vertical frame (palindrome-safe)."""
    row = blank()
    sym_set(row, 0, OUTER - 1)
    row[INNER_L] = row[INNER_R] = "1"
    row[INNER_L + 1] = row[INNER_R - 1] = "1"
    return row


def screen_lip():
    """Horizontal inner edge at top/bottom of CRT glass."""
    row = blank()
    row[INNER_L] = row[INNER_R] = "1"
    row[INNER_L + 1] = row[INNER_R - 1] = "1"
    return row


def stand_row():
    row = blank()
    sym_set(row, 8, 11)
    return row


def flame_row(half_w, color):
    """Symmetric flame span; half_w=0 -> cols 9-10, half_w=4 -> cols 5-14."""
    lo = 9 - half_w
    hi = 10 + half_w
    row = side_bezel()
    sym_set(row, lo, hi)
    return row, color


def build_flame(frame):
    """Tall tapered flame — 40 rows, symmetric widths."""
    # half-widths peak in the middle (wide base/torch), narrow tip
    profile_a = [
        0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
        3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
    ]
    profile_b = [
        0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 4, 4, 4, 4,
        3, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
    ]
    prof = profile_b if frame else profile_a
    rows = []
    for hw in prof:
        if hw <= 1:
            col = FY
        elif hw <= 3:
            col = FO
        else:
            col = FR
        rows.append(flame_row(hw, col))
    return rows


def build_frame(frame):
    flame = build_flame(frame)
    screen_end = LINES - BOT_ROWS - STAND_ROWS
    lines = []

    for y in range(LINES):
        if y < TOP_ROWS:
            bits = top_bottom_bar()
            col = CB
        elif y == TOP_ROWS:
            bits = screen_lip()
            col = CB
        elif y < screen_end - 1:
            bits = side_bezel()
            col = CB
        elif y == screen_end - 1:
            bits = screen_lip()
            col = CB
            fi = y - FIRE_START
            if 0 <= fi < len(flame):
                bits, col = flame[fi]
        elif y < screen_end + BOT_ROWS:
            bits = top_bottom_bar()
            col = CB
        else:
            bits = stand_row()
            col = CB

        pf0, pf1, pf2 = encode20("".join(bits))
        lines.append((pf0, pf1, pf2, CF, col, col))

    return lines


def to_display(bits20):
    """How Stella maps authored 20 bits onto 40 playfield pixels."""
    d = ["."] * 40
    for i, c in enumerate(bits20):
        if c == "1":
            d[i] = d[39 - i] = "#"
    return "".join(d)


def bits_from_row(row):
    return format(row[0], "04b") + format(row[1], "08b") + format(row[2], "08b")


def emit_table(name, lines):
    pf0 = [f"${r[0]:02X}" for r in lines]
    pf1 = [f"${r[1]:02X}" for r in lines]
    pf2 = [f"${r[2]:02X}" for r in lines]
    bk = [f"${r[3]:02X}" for r in lines]
    c0 = [f"${r[4]:02X}" for r in lines]
    c1 = [f"${r[5]:02X}" for r in lines]

    out = [f"; {name}", f"{name}Pf0"]
    for i in range(0, LINES, 12):
        out.append("    byte    " + ", ".join(pf0[i : i + 12]))
    out.append(f"{name}Pf1")
    for i in range(0, LINES, 12):
        out.append("    byte    " + ", ".join(pf1[i : i + 12]))
    out.append(f"{name}Pf2")
    for i in range(0, LINES, 12):
        out.append("    byte    " + ", ".join(pf2[i : i + 12]))
    out.append(f"{name}Bk")
    for i in range(0, LINES, 12):
        out.append("    byte    " + ", ".join(bk[i : i + 12]))
    out.append(f"{name}Col0")
    for i in range(0, LINES, 12):
        out.append("    byte    " + ", ".join(c0[i : i + 12]))
    out.append(f"{name}Col1")
    for i in range(0, LINES, 12):
        out.append("    byte    " + ", ".join(c1[i : i + 12]))
    return out


def main():
    a = build_frame(0)
    assert len(a) == LINES

    print("=== 40px mirrored preview (one monitor + one flame) ===")
    for y in [0, 17, 30, 62, 80, 95, 150, 168, 180]:
        print(f"y{y:3}: {to_display(bits_from_row(a[y]))}")

    out = [
        "; title_assets.asm — monitor + fire (palindrome-safe for PF mirror)",
        "",
    ]
    out.extend(emit_table("TitleA", a))
    out.append("")
    out.extend(emit_table("TitleB", build_frame(1)))
    out.append("")

    with open("source/data/title_assets.asm", "w") as f:
        f.write("\n".join(out))
    print(f"\nWrote source/data/title_assets.asm ({LINES} lines)")


if __name__ == "__main__":
    main()
