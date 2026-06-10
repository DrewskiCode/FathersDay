;==============================================================================
; sprites.asm — Bank 3 sprite bitmap data (placeholders)
;==============================================================================

; Placeholder asset data in Bank 3 code segment (no SEG DATA — avoids 64KB ROM blowout)

PlayerSprite
    byte    %00111100
    byte    %01111110
    byte    %11111111
    byte    %01111110
    byte    %00111100
    byte    %00011000
    byte    %00011000
    byte    %00011000

PlayerSpriteHeight = . - PlayerSprite

FireSpriteYellow    byte %00011000
FireSpriteOrange    byte %00111100
FireSpriteRed       byte %01111110
FireSpritePurple    byte %01011010
FireSpriteGreen     byte %00111100

ComputerSprite
    byte    %11111111
    byte    %10000001
    byte    %10111101
    byte    %10111101
    byte    %10000001
    byte    %11111111

ComputerSpriteHeight = . - ComputerSprite
