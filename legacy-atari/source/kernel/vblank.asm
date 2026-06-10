;==============================================================================
; vblank.asm
;
; VBLANK timing wait — 37 scanlines while beam is blanked.
; Future: gameplay update calls move here from MainLoop (vblank budget ~2200 cy)
; For now: timing shell only.
;==============================================================================

VblankWait
    ldx     #LINES_VBLANK
VblankLineLoop
    lda     #0
    sta     WSYNC               ; TIA: wait one scanline
    dex
    bne     VblankLineLoop
    rts
