;==============================================================================
; silence_audio.asm
;
; MUTE_TIA — inline TIA audio mute (never jsr — $F107 differs per bank).
;==============================================================================

    MAC MUTE_TIA
    lda     #0
    sta     AUDV0
    sta     AUDV1
    sta     AUDC0
    sta     AUDC1
    sta     AUDF0
    sta     AUDF1
    ENDM

;------------------------------------------------------------------------------
; LOCK_BANK0 — F6 bankswitch guard (all game code + data live in bank 0)
;------------------------------------------------------------------------------
    MAC LOCK_BANK0
    lda     BANK0_HOTSPOT
    ENDM
