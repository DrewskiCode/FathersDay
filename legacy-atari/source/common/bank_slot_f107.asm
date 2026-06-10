;==============================================================================
; bank_slot_f107.asm
;
; Byte-identical at $F107 in every bank. Stray execution must NOT re-enter
; ResetBank0 mid-frame (that corrupts the stack and TIA timing). Lock bank 0
; and spin so Stella shows a hang instead of executing zero-page garbage.
;==============================================================================

    lda     BANK0_HOTSPOT
F107Lock
    jmp     F107Lock
