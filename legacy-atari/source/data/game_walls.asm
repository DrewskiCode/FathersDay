;==============================================================================
; game_walls.asm
;
; Axis-aligned wall boxes per room: X, Y, Width, Height — terminator $FF.
; Used by CheckWallCollision in office.asm.
;==============================================================================

WallLeft
    byte    16,  50,  100,  8
    byte    16,  120,  80,  8
    byte    60,  70,  12,  50
    byte    100, 50,  12,  40
    byte    $FF

WallCenter
    byte    16,  55,  128,  8
    byte    16,  125, 128,  8
    byte    50,  65,  12,  45
    byte    95,  65,  12,  45
    byte    70,  95,  24,  12
    byte    $FF

WallRight
    byte    16,  50,  100,  8
    byte    16,  120,  80,  8
    byte    50,  70,  12,  50
    byte    90,  50,  12,  40
    byte    $FF

RoomWallPtrL
    .byte <WallLeft, <WallCenter, <WallRight
RoomWallPtrH
    .byte >WallLeft, >WallCenter, >WallRight
