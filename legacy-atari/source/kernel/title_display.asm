;==============================================================================
; title_display.asm
;
; Flat scanline title kernel — full-screen monitor + fire (gen_title.py).
; CTRLPF_DEFAULT: continuous 20-bit bezel; symmetric fire flickers A/B.
;==============================================================================

    include "data/title_assets.asm"

;------------------------------------------------------------------------------
; DisplayTitleScreen — exactly 192 visible scanlines
;------------------------------------------------------------------------------
DisplayTitleScreen
    lda     #0
    sta     PF0
    sta     PF1
    sta     PF2
    sta     GRP0
    sta     GRP1
    sta     ENAM0
    sta     ENAM1

    lda     #CTRLPF_DEFAULT
    sta     CTRLPF

    lda     #0
    sta     scanline
    ldx     #LINES_VISIBLE

    lda     titleFlameFrame + SC_READ_OFFSET
    sta     temp1

TitleDrawLine
    lda     #0
    sta     WSYNC

    ldy     scanline
    lda     temp1
    bne     TitleUseB

    lda     TitleABk,y
    sta     COLUBK
    lda     TitleACol0,y
    sta     COLUP0
    lda     TitleACol1,y
    sta     COLUP1
    sta     COLUPF
    lda     TitleAPf0,y
    sta     PF0
    lda     TitleAPf1,y
    sta     PF1
    lda     TitleAPf2,y
    sta     PF2
    jmp     TitleNextLine

TitleUseB
    lda     TitleBBk,y
    sta     COLUBK
    lda     TitleBCol0,y
    sta     COLUP0
    lda     TitleBCol1,y
    sta     COLUP1
    sta     COLUPF
    lda     TitleBPf0,y
    sta     PF0
    lda     TitleBPf1,y
    sta     PF1
    lda     TitleBPf2,y
    sta     PF2

TitleNextLine
    inc     scanline
    dex
    bne     TitleDrawLine

    lda     #0
    sta     PF0
    sta     PF1
    sta     PF2
    rts
