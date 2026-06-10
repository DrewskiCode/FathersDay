;==============================================================================
; state.asm
;
; Game state machine — dispatches update logic based on gameState variable.
; Lives in Bank 0 (main loop calls this every frame before rendering).
;
; States: STATE_TITLE, STATE_PLAYING, STATE_GAMEOVER (see enums.asm)
; Gameplay not implemented yet — stubs only increment frameCounter.
;==============================================================================

;------------------------------------------------------------------------------
; UpdateStateMachine — called once per frame from MainLoop
;------------------------------------------------------------------------------
UpdateStateMachine
    jsr     IncFrameCounter

    lda     stateCache
    cmp     #STATE_TITLE
    bne     CheckPlaying
    jsr     UpdateTitleState
    rts

CheckPlaying
    cmp     #STATE_PLAYING
    bne     UpdateGameOverState
    jsr     UpdatePlayingState
    rts

;------------------------------------------------------------------------------
; UpdateTitleState — title screen logic (stub → modules/title.asm in M1)
;------------------------------------------------------------------------------
UpdateTitleState
    jsr     TitleUpdate
    rts

;------------------------------------------------------------------------------
; UpdatePlayingState — active game logic (stub → Bank 2 via CallBank2 in M2+)
;------------------------------------------------------------------------------
UpdatePlayingState
    jsr     ReadInput
    jsr     UpdatePlayer
    jsr     UpdateOffice
    rts

;------------------------------------------------------------------------------
; UpdateGameOverState — game over logic (stub → modules/gameover.asm in M9)
;------------------------------------------------------------------------------
UpdateGameOverState
    ; TODO M9: call GameOverUpdate
    rts

;------------------------------------------------------------------------------
; SetGameState — transition to new state (A = new STATE_*)
;------------------------------------------------------------------------------
SetGameState
    sta     gameState
    sta     stateCache
    ; Update kernel mode to match
    cmp     #STATE_TITLE
    bne     NotTitleKernelSet
    lda     #KERNEL_MODE_TITLE
    jmp     SetKernelMode
NotTitleKernelSet
    cmp     #STATE_PLAYING
    bne     GameOverKernelSet
    lda     #KERNEL_MODE_GAME
    sta     kernelState
    jsr     GameInit
    rts
GameOverKernelSet
    lda     #KERNEL_MODE_GAMEOVER
SetKernelMode
    sta     kernelState         ; ZP: tell display kernel which layout to draw
    rts
