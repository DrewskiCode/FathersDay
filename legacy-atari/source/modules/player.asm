;==============================================================================
; player.asm
;
; Pyro movement — 8-direction, wall collision, room edge detection.
;==============================================================================

;------------------------------------------------------------------------------
; UpdatePlayer — apply inputDir to playerX/Y with collision
;------------------------------------------------------------------------------
UpdatePlayer
    lda     inputDir + SC_READ_OFFSET
    beq     PlayerDone

    ldy     inputDir + SC_READ_OFFSET
    lda     DirDeltaX,y
    clc
    adc     playerX + SC_READ_OFFSET
    sta     mapCursor             ; proposed X (SC temp)

    lda     DirDeltaY,y
    clc
    adc     playerY + SC_READ_OFFSET
    sta     mapCursor + 1         ; proposed Y

    lda     mapCursor + SC_READ_OFFSET
    ldx     mapCursor + 1 + SC_READ_OFFSET
    jsr     CheckWallCollision
    bcs     PlayerDone

    lda     mapCursor + SC_READ_OFFSET
    sta     playerX
    lda     mapCursor + 1 + SC_READ_OFFSET
    sta     playerY
    lda     inputDir + SC_READ_OFFSET
    sta     playerDir
PlayerDone
    rts
