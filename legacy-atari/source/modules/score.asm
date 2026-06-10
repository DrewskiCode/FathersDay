;==============================================================================
; score.asm
;
; Scoring, high score tracking, and score display prep.
; Bank 2 module.
;
; Point values from constants.asm (100 normal, 200 special).
; Score display rendering handled by kernel reading score variable.
; Not implemented — stub only.
;==============================================================================

AddScore
    ; TODO M7: A = low byte of points to add (simplified 8-bit for now)
    ; TODO M7: update score, compare to highScore
    rts

PrepareScoreDisplay
    ; TODO M7: convert score to BCD digits in frameTemps for kernel
    rts
