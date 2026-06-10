;==============================================================================
; game_display.asm
;
; Gameplay visible kernel — room floor, maze walls (playfield), Pyro sprite.
; Burns exactly LINES_VISIBLE (192) scanlines.
;==============================================================================

GamePlayerSprite
    byte    %00111100
    byte    %01111110
    byte    %11111111
    byte    %01111110
    byte    %00111100
    byte    %00011000
    byte    %00011000
    byte    %00011000

;------------------------------------------------------------------------------
; DisplayGameScreen
;------------------------------------------------------------------------------
DisplayGameScreen
    lda     #0
    sta     PF0
    sta     PF1
    sta     PF2
    sta     GRP0
    sta     GRP1
    sta     ENAM0
    sta     ENAM1

    lda     #CTRLPF_REFLECT
    sta     CTRLPF

    lda     #COLU_WALL
    sta     COLUPF

    lda     #COLU_PYRO
    sta     COLUP0

    lda     currentRoom + SC_READ_OFFSET
    cmp     #ROOM_LEFT
    bne     NotLeftBg
    lda     #COLU_WALL
    jmp     SetRoomBg
NotLeftBg
    lda     #COLU_FLOOR
SetRoomBg
    sta     COLUBK

    lda     #0
    sta     scanline
    ldy     #LINES_VISIBLE

GameScanLoop
    lda     #0
    sta     WSYNC
    lda     scanline
    jsr     DrawRoomWallPf

    lda     scanline
    sec
    sbc     playerY + SC_READ_OFFSET
    cmp     #PLAYER_SPRITE_H
    bcs     GameNoSprite
    tax
    lda     GamePlayerSprite,x
    sta     GRP0
    jmp     GameAfterSprite
GameNoSprite
    lda     #0
    sta     GRP0
GameAfterSprite
    inc     scanline
    dey
    bne     GameScanLoop

    lda     #0
    sta     PF0
    sta     PF1
    sta     PF2
    sta     GRP0
    rts

;------------------------------------------------------------------------------
; DrawRoomWallPf — maze walls for this scanline (A = Y)
;------------------------------------------------------------------------------
DrawRoomWallPf
    sta     temp1
    lda     #0
    sta     PF0
    sta     PF1
    sta     PF2

    lda     currentRoom + SC_READ_OFFSET
    cmp     #ROOM_CENTER
    bne     DrawSideWalls

    lda     temp1
    cmp     #55
    beq     FullWall
    cmp     #125
    beq     FullWall
    cmp     #95
    bcc     DrawCenterDone
    cmp     #107
    bcs     DrawCenterDone
    lda     #%00011000
    sta     PF1
    lda     #%00011000
    sta     PF2
    rts
FullWall
    lda     #%11111111
    sta     PF1
    sta     PF2
    rts

DrawSideWalls
    lda     temp1
    cmp     #50
    beq     FullWall
    cmp     #120
    beq     FullWall
    cmp     #70
    bcc     DrawCenterDone
    cmp     #120
    bcs     DrawCenterDone
    lda     #%00010000
    sta     PF1
DrawCenterDone
    rts
