;==============================================================================
; bank_stub_fill.asm
;
; Banks 1–3: trap sled (lda bank0 + jmp F107Lock). Never executes random
; bank-0 code at stray addresses — the old ldx tiles caused TIA garbage.
;==============================================================================

    REPEAT 637
        lda     BANK0_HOTSPOT
        jmp     F107Lock
    REPEND

    IF      . < $FFFC
        ds      $FFFC - .
    ENDIF
