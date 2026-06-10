;==============================================================================
; office.asm
;
; Three-room office: maze wall collision, horizontal door transitions.
;==============================================================================

wallWy  = frameTemps + 4
wallWw  = frameTemps + 5
wallWh  = frameTemps + 6

;------------------------------------------------------------------------------
; GameInit — called when entering STATE_PLAYING (center room, center screen)
;------------------------------------------------------------------------------
GameInit
    lda     #START_ROOM
    sta     currentRoom
    lda     #80
    sta     playerX
    lda     #100
    sta     playerY
    lda     #0
    sta     playerDir
    lda     #FUEL_START
    sta     extinguisherFuel
    rts

;------------------------------------------------------------------------------
; UpdateOffice — room transitions via screen edges
;------------------------------------------------------------------------------
UpdateOffice
    lda     currentRoom + SC_READ_OFFSET
    cmp     #ROOM_CENTER
    bne     CheckSideRoomExit

    lda     playerX + SC_READ_OFFSET
    cmp     #DOOR_EDGE_X
    bcc     EnterLeftRoom
    lda     playerX + SC_READ_OFFSET
    cmp     #DOOR_EDGE_X_RIGHT
    bcc     OfficeDone
    jmp     EnterRightRoom

CheckSideRoomExit
    cmp     #ROOM_LEFT
    beq     CheckLeftExit
    ; ROOM_RIGHT — exit west to center
    lda     playerX + SC_READ_OFFSET
    cmp     #DOOR_EDGE_X
    bcs     OfficeDone
    lda     #ROOM_CENTER
    sta     currentRoom
    lda     #SPAWN_CENTER_FROM_L
    sta     playerX
    rts

CheckLeftExit
    lda     playerX + SC_READ_OFFSET
    cmp     #DOOR_EDGE_X_RIGHT
    bcc     OfficeDone
    lda     #ROOM_CENTER
    sta     currentRoom
    lda     #SPAWN_CENTER_FROM_R
    sta     playerX
OfficeDone
    rts

EnterLeftRoom
    lda     #ROOM_LEFT
    sta     currentRoom
    lda     #SPAWN_SIDE_FROM_C
    sta     playerX
    rts

EnterRightRoom
    lda     #ROOM_RIGHT
    sta     currentRoom
    lda     #SPAWN_SIDE_INNER
    sta     playerX
    rts

;------------------------------------------------------------------------------
; CheckWallCollision — A = proposed X, X = proposed Y; returns C set if blocked
;------------------------------------------------------------------------------
CheckWallCollision
    pha                         ; save proposed X on stack
    txa
    pha                         ; save proposed Y

    lda     currentRoom + SC_READ_OFFSET
    tay
    lda     RoomWallPtrL,y
    sta     pfrow
    lda     RoomWallPtrH,y
    sta     pfrow + 1

    pla
    tax                         ; proposed Y in X
    pla                         ; proposed X in A
    sta     mapCursor             ; px
    stx     mapCursor + 1         ; py

    ldy     #0
WallBoxLoop
    lda     (pfrow),y
    cmp     #$FF
    beq     WallClear

    sta     temp1                 ; wx
    iny
    lda     (pfrow),y
    sta     wallWy
    iny
    lda     (pfrow),y
    sta     wallWw
    iny
    lda     (pfrow),y
    sta     wallWh
    iny

    jsr     BoxOverlap
    bcs     WallBlocked

    jmp     WallBoxLoop

WallClear
    clc
    rts
WallBlocked
    sec
    rts

;------------------------------------------------------------------------------
; BoxOverlap — player rect vs wall box; C set on overlap
; Uses mapCursor=px, mapCursor+1=py, temp1=wx, wallWy, wallWw, wallWh
;------------------------------------------------------------------------------
BoxOverlap
    lda     mapCursor + SC_READ_OFFSET
    clc
    adc     #PLAYER_SPRITE_W
    cmp     temp1
    bcc     NoOverlap
    lda     temp1
    clc
    adc     wallWw
    cmp     mapCursor + SC_READ_OFFSET
    bcc     NoOverlap
    lda     mapCursor + 1 + SC_READ_OFFSET
    clc
    adc     #PLAYER_SPRITE_H
    cmp     wallWy
    bcc     NoOverlap
    lda     wallWy
    clc
    adc     wallWh
    cmp     mapCursor + 1 + SC_READ_OFFSET
    bcc     NoOverlap
    sec
    rts
NoOverlap
    clc
    rts

