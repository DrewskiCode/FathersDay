;==============================================================================
; bankswitch.asm
;
; F6 cross-bank call trampolines (Bank 0 resident).
;
; F6 switches banks by reading a hotspot address. After the read, code at the
; same CPU address executes from the new bank's ROM. Call stubs switch out,
; jsr the target routine (fixed RORG address in target bank), then switch back.
;
; Hotspots (see hardware.asm):
;   $1FF8 = Bank 0    $1FF9 = Bank 1
;   $1FF6 = Bank 2    $1FF7 = Bank 3
;==============================================================================

; BANK1_ENTRY, BANK2_ENTRY, BANK3_ENTRY defined in hardware.asm

;------------------------------------------------------------------------------
; SwitchToBank0 — ensure Bank 0 is mapped (call after any bank switch)
;------------------------------------------------------------------------------
SwitchToBank0
    ldx     BANK0_HOTSPOT       ; read hotspot → select Bank 0
    rts

;------------------------------------------------------------------------------
; SwitchToBank1
;------------------------------------------------------------------------------
SwitchToBank1
    ldx     BANK1_HOTSPOT       ; read hotspot → select Bank 1
    rts

;------------------------------------------------------------------------------
; SwitchToBank2
;------------------------------------------------------------------------------
SwitchToBank2
    ldx     BANK2_HOTSPOT       ; read hotspot → select Bank 2
    rts

;------------------------------------------------------------------------------
; SwitchToBank3
;------------------------------------------------------------------------------
SwitchToBank3
    ldx     BANK3_HOTSPOT       ; read hotspot → select Bank 3
    rts

;------------------------------------------------------------------------------
; CallBank1 — invoke Bank 1 entry point (display kernel / screens)
; Saves nothing — caller must not rely on A/X/Y across call if kernel clobbers
;------------------------------------------------------------------------------
CallBank1
    ldx     BANK1_HOTSPOT
    jsr     Bank1Entry
    ldx     BANK0_HOTSPOT
    rts

;------------------------------------------------------------------------------
; CallBank2 — invoke Bank 2 entry point (gameplay update)
;------------------------------------------------------------------------------
CallBank2
    ldx     BANK2_HOTSPOT
    jsr     Bank2Entry
    ldx     BANK0_HOTSPOT
    rts

;------------------------------------------------------------------------------
; CallBank3 — invoke Bank 3 entry point (data access — rarely needed at runtime)
;------------------------------------------------------------------------------
CallBank3
    ldx     BANK3_HOTSPOT
    jsr     Bank3Entry
    ldx     BANK0_HOTSPOT
    rts
