;==============================================================================
; input.asm
;
; Joystick input — 8-direction from SWCHA, fire button from INPT4.
;==============================================================================

DirTable
    .byte   DIR_NONE, DIR_N,  DIR_S,  DIR_NONE
    .byte   DIR_W,    DIR_NW, DIR_SW, DIR_NONE
    .byte   DIR_E,    DIR_NE, DIR_SE, DIR_NONE
    .byte   DIR_NONE, DIR_NONE, DIR_NONE, DIR_NONE

DirDeltaX
    .byte   0,  0,  1,  1,  0, -1, -1, -1,  0
DirDeltaY
    .byte   0, -1, -1,  0,  1,  1,  0, -1,  0

;------------------------------------------------------------------------------
; ReadInput — decode joystick into inputDir and inputFire
;------------------------------------------------------------------------------
ReadInput
    lda     SWCHA                 ; RIOT port A — directions active low
    eor     #$FF
    and     #$F0
    lsr
    lsr
    lsr
    lsr
    tax
    lda     DirTable,x
    sta     inputDir

    lda     INPT4                 ; fire button — bit 7 clear when pressed
    and     #FIRE_PRESSED
    beq     FireDown
    lda     #0
    sta     inputFire
    rts
FireDown
    lda     #1
    sta     inputFire
    rts
