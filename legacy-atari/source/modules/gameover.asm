;==============================================================================
; gameover.asm
;
; Game over screen — building exterior, fireworks, final score.
; Bank 1 module (presentation layer).
;
; Called when gameState == STATE_GAMEOVER.
; Not implemented — stub only.
;==============================================================================

GameOverUpdate
    ; TODO M9: animate fireworks sprites
    ; TODO M9: display final score from score variable
    ; TODO M9: if fire pressed → SetGameState(STATE_TITLE)
    rts

GameOverSetupDraw
    ; TODO M9: load game over playfield and sprite data for kernel
    rts
