;==============================================================================
; overscan.asm
;
; Overscan period — 30 scanlines after visible display.
;==============================================================================

OverscanWait
    ldx     #LINES_OVERSCAN
OverscanLoop
    lda     #0
    sta     WSYNC
    dex
    bne     OverscanLoop
    rts
