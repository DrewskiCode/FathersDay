;==============================================================================
; boot_core.asm
;
; Stable inline NTSC frame shell + title RLE kernel.
; Every WSYNC is lda #0 / sta WSYNC for consistent beam timing.
;==============================================================================

    include "common/startup.asm"

;------------------------------------------------------------------------------
; MainLoop
;------------------------------------------------------------------------------
MainLoop
    lda     #VSYNC_ON
    sta     VSYNC
    ldx     #LINES_VSYNC
ML_Vsync
    lda     #0
    sta     WSYNC
    dex
    bne     ML_Vsync

    lda     #VSYNC_OFF
    sta     VSYNC

    lda     #VBLANK_ON
    sta     VBLANK
    ldx     #LINES_VBLANK
ML_Vblank
    lda     #0
    sta     WSYNC
    dex
    bne     ML_Vblank

    lda     #VBLANK_OFF
    sta     WSYNC
    sta     VBLANK

    lda     stateCache
    cmp     #STATE_TITLE
    bne     ML_SolidFloor
    jsr     DisplayTitleScreen
    jmp     ML_AfterVisible

ML_SolidFloor
    lda     #COLU_FLOOR
    ldx     #LINES_VISIBLE
ML_Visible
    lda     #0
    sta     WSYNC
    sta     COLUBK
    dex
    bne     ML_Visible

ML_AfterVisible
    lda     #VBLANK_ON
    sta     VBLANK
    MUTE_TIA

    jsr     IncFrameCounter
    lda     stateCache
    cmp     #STATE_TITLE
    bne     ML_SkipTitleUpdate
    jsr     TitleUpdate
ML_SkipTitleUpdate

    ldx     #LINES_OVERSCAN
ML_Overscan
    lda     #0
    sta     WSYNC
    dex
    bne     ML_Overscan

    jmp     MainLoop
