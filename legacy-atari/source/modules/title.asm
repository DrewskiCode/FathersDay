;==============================================================================
; title.asm
;
; Title screen update — flame frame toggle, fire to start.
; Art is flat tables in title_assets.asm (A/B); kernel reads titleFlameFrame.
;==============================================================================

;------------------------------------------------------------------------------
; TitleUpdate — called once per frame during overscan
;------------------------------------------------------------------------------
TitleUpdate
    jsr     TitleAnimateFlame
    jsr     TitleCheckFire
    rts

;------------------------------------------------------------------------------
; TitleInit
;------------------------------------------------------------------------------
TitleInit
    lda     #0
    sta     titleFlameFrame
    sta     titleFireLock
    sta     quarterFrame
    sta     frameCounter
    lda     #1
    sta     titlePromptVisible
    rts

;------------------------------------------------------------------------------
; TitleAnimateFlame — toggle 0/1 every TITLE_FLAME_FRAMES
;------------------------------------------------------------------------------
TitleAnimateFlame
    lda     frameCounter + SC_READ_OFFSET
    and     #TITLE_FLAME_FRAMES - 1
    bne     TitleFlameDone

    lda     titleFlameFrame + SC_READ_OFFSET
    eor     #1
    sta     titleFlameFrame

TitleFlameDone
    rts

;------------------------------------------------------------------------------
; TitleCheckFire — INPT4 active low; debounced edge to STATE_PLAYING
;------------------------------------------------------------------------------
TitleCheckFire
    lda     frameCounter + SC_READ_OFFSET
    cmp     #30
    bcc     TitleCheckDone

    lda     INPT4
    bmi     TitleFireReleased

    lda     titleFireLock + SC_READ_OFFSET
    bne     TitleCheckDone

    lda     #1
    sta     titleFireLock
    lda     #STATE_PLAYING
    jsr     SetGameState
    rts

TitleFireReleased
    lda     #0
    sta     titleFireLock

TitleCheckDone
    rts

;------------------------------------------------------------------------------
; SetGameState
;------------------------------------------------------------------------------
SetGameState
    sta     gameState
    sta     stateCache
    cmp     #STATE_PLAYING
    bne     SetGsDone
    lda     #KERNEL_MODE_GAME
    sta     kernelState
SetGsDone
    rts
