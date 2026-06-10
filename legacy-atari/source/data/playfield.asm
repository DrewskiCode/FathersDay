;==============================================================================
; playfield.asm
;
; Playfield (PF0/PF1/PF2) bitmap data for walls, title screen, game over scene.
; Bank 3 — read-only asset data.
;
; PF registers hold 4+8+8 = 20 bits per scanline (mirrored or asymmetric).
; Placeholder: empty tables until M1/M3 art pass.
;==============================================================================

TitlePlayfield
    ; Title art lives in data/title_assets.asm (included by kernel/title_display.asm)
    byte    0, 0, 0

; Game room wall pattern placeholder (M3)
RoomWallPattern
    byte    %11111111           ; PF1 — solid wall row
    byte    %10000001           ; PF1/PF2 — hollow room row
    byte    %10000001
    byte    %11111111

RoomWallPatternRows = . - RoomWallPattern

; Game over building silhouette placeholder (M9)
GameOverPlayfield
    byte    0, 0, 0
