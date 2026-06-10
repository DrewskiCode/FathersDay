;==============================================================================
; rooms.asm
;
; Three-screen office layout (SPEC v2): Left / Center / Right.
; Each room: door flags, computer count, refill flag.
; Wall collision boxes live in data/game_walls.asm.
;==============================================================================

RoomData
    ; Room 0 — Left Office (exit east → center)
    byte    %00000010           ; door east only
    byte    COMPUTERS_PER_ROOM
    byte    1                   ; has refill station
    byte    0

    ; Room 1 — Center Office (start room; doors west + east)
    byte    %00000101           ; doors west, east
    byte    COMPUTERS_PER_ROOM
    byte    0
    byte    0

    ; Room 2 — Right Office (exit west → center)
    byte    %00000001           ; door west only
    byte    COMPUTERS_PER_ROOM
    byte    1                   ; has refill station
    byte    0

RoomDataSize        = . - RoomData

; Computer positions (X, Y) per room — compact terminals (M4 fills all slots)
ComputerPositions
    ; Room 0 — left office
    byte    30, 60
    byte    60, 100
    byte    90, 60
    byte    50, 140
    byte    110, 120
    ; Room 1 — center office
    byte    50, 70
    byte    80, 120
    byte    110, 70
    byte    70, 150
    byte    120, 130
    ; Room 2 — right office
    byte    40, 65
    byte    70, 110
    byte    100, 65
    byte    55, 145
    byte    115, 115
    byte    0                   ; end marker
