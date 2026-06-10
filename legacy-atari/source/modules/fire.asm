;==============================================================================
; fire.asm
;
; Fire spawning, 3-stage progression, and special fires.
; Bank 2 module.
;
; Manages fireTable in Superchip RAM (MAX_FIRES slots × FIRE_RECORD_SIZE).
; Yellow → Orange → Red progression; red timeout triggers game over.
; Not implemented — stub only.
;==============================================================================

UpdateFires
    ; TODO M5: spawn fires on random computers via randSeed LFSR
    ; TODO M5: advance fireTimer per stage (FIRE_STAGE_* constants)
    ; TODO M5: trigger SetGameState(STATE_GAMEOVER) on critical red timeout
    ; TODO M8: rare purple/green special fire spawns
    rts

; ClearAllFires — called by green power-up (M8)
ClearAllFires
    lda     #0
    sta     activeFireCount
    ; TODO M8: zero all fireTable slots
    rts
