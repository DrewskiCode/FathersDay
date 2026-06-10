;==============================================================================
; startup.asm
;
; Minimal boot — proven stable in Stella (no bulk Superchip clear).
;==============================================================================

;------------------------------------------------------------------------------
; ResetBank0
;------------------------------------------------------------------------------
ResetBank0
    sei
    cld
    ldx     #$FF
    txs
    lda     #0
    tax
    tay

    MUTE_TIA

    lda     #STATE_TITLE
    sta     gameState
    sta     stateCache

    lda     #KERNEL_MODE_TITLE
    sta     kernelState

    lda     #VBLANK_OFF
    sta     VBLANK
    sta     VSYNC

    lda     #0
    sta     HMCLR
    sta     CXCLR
    sta     CTRLPF
    sta     PF0
    sta     PF1
    sta     PF2
    sta     GRP0
    sta     GRP1
    sta     ENAM0
    sta     ENAM1
    sta     ENABL

    jsr     TitleInit
    jmp     MainLoop
