;==============================================================================
; superchip.asm
;
; Superchip-safe read/modify/write helpers. Never INC/DEC on $F000-$F07F.
;==============================================================================

;------------------------------------------------------------------------------
; IncFrameCounter
;------------------------------------------------------------------------------
IncFrameCounter
    lda     frameCounter + SC_READ_OFFSET
    clc
    adc     #1
    sta     frameCounter
    rts

;------------------------------------------------------------------------------
; IncQuarterFrame
;------------------------------------------------------------------------------
IncQuarterFrame
    lda     quarterFrame + SC_READ_OFFSET
    clc
    adc     #1
    sta     quarterFrame
    rts
