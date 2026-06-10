;==============================================================================
; kernel.asm
;==============================================================================

    include "kernel/vblank.asm"
    include "kernel/display.asm"
    include "kernel/overscan.asm"

;------------------------------------------------------------------------------
; KernelFrame
;------------------------------------------------------------------------------
KernelFrame
    jsr     BeginFrame
    jsr     DisplayTitleScreen
    jsr     EndFrame
    rts

;------------------------------------------------------------------------------
; BeginFrame — NTSC VSYNC + VBLANK (3 + 37 lines)
;------------------------------------------------------------------------------
BeginFrame
    lda     #VSYNC_ON
    sta     VSYNC

    ldx     #LINES_VSYNC
VsyncLoop
    sta     WSYNC
    dex
    bne     VsyncLoop

    lda     #VSYNC_OFF
    sta     VSYNC

    lda     #VBLANK_ON
    sta     VBLANK

    jsr     VblankWait

    lda     #VBLANK_OFF
    sta     WSYNC
    sta     VBLANK
    rts

;------------------------------------------------------------------------------
; EndFrame — overscan (30 lines, vblank on)
;------------------------------------------------------------------------------
EndFrame
    lda     #VBLANK_ON
    sta     VBLANK
    MUTE_TIA
    jsr     OverscanWait
    rts
