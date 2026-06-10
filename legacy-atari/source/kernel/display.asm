;==============================================================================
; display.asm
;
; Visible display kernel (192 scanlines, NTSC).
;==============================================================================

    include "kernel/title_display.asm"
    include "kernel/game_display.asm"

DisplayVisible
    ; Title-only until kernel timing is stable (M1)
    jmp     DisplayTitleScreen
