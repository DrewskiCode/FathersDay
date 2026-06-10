;==============================================================================
; hardware.asm
;
; Melody Board / F6SC hardware definitions for Pyro Pyro.
; DASM equates must start at column 0 (no leading whitespace).
;==============================================================================

; Cartridge profile: F6 bankswitch + Superchip (128B RAM) for Melody Board
ROM_SIZE           = $4000
NUM_BANKS          = 4
BANK_SIZE          = $1000

; F6 bankswitch hotspots (read to select bank)
BANK2_HOTSPOT      = $1FF6
BANK3_HOTSPOT      = $1FF7
BANK0_HOTSPOT      = $1FF8
BANK1_HOTSPOT      = $1FF9

BANK_INDEX_0       = 0
BANK_INDEX_1       = 1
BANK_INDEX_2       = 2
BANK_INDEX_3       = 3

; F6SC: Superchip occupies $F000-$F0FF (128B write + 128B read) — no code there
CODE_START         = $F100
COLD_START_SIZE    = 7         ; sei + lda hotspot + jmp (common/cold_start.asm)
; BANK1/2/3_ENTRY labels are defined in each bank file after boot_core.asm

; Superchip RAM (write $F000-$F07F, read $F080-$F0FF)
SC_WRITE_BASE      = $F000
SC_READ_BASE       = $F080
SC_RAM_SIZE        = $80
SC_READ_OFFSET     = SC_READ_BASE - SC_WRITE_BASE

; Joystick bit masks (active low on SWCHA — register defined in vcs.h)
JOY_UP             = %00010000
JOY_DOWN           = %00100000
JOY_LEFT           = %10000000
JOY_RIGHT          = %01000000
JOY_NO_INPUT       = %11110000
FIRE_PRESSED       = %10000000

; NTSC frame timing
CYCLES_PER_LINE    = 76
LINES_VSYNC        = 3
LINES_VBLANK       = 37
LINES_VISIBLE      = 192
LINES_OVERSCAN     = 30
LINES_PER_FRAME    = 262

VBLANK_ON          = $02
VBLANK_OFF         = $00
VSYNC_ON           = $02
VSYNC_OFF          = $00

; CTRLPF bit flags
CTRLPF_REFLECT     = %00000001
CTRLPF_SCORE       = %00000010
CTRLPF_PFPRI       = %00000100
CTRLPF_BALL8       = %00001000
CTRLPF_PF2L        = %00010000
CTRLPF_PF0R        = %00100000
CTRLPF_DEFAULT     = %00000000

; NTSC color placeholders (COLUPx format — high nibble = luminance)
COLU_PYRO          = $CE        ; bright orange (accents)
COLU_TITLE_YELLOW  = $2C        ; bright gold title (hue 2 — reads yellow on TV)
COLU_WALL          = $46        ; medium grey (office walls / computers)
COLU_BEZEL         = $04        ; dark grey monitor bezel (high contrast)
COLU_FLOOR         = $4A        ; salmon floor (hue 4)
COLU_FIRE_YELLOW   = $1C        ; hue 1
COLU_FIRE_ORANGE   = $26        ; hue 2 orange
COLU_FIRE_RED      = $32        ; hue 3 red
COLU_FIRE_PURPLE   = $3A
COLU_FIRE_GREEN    = $C6
