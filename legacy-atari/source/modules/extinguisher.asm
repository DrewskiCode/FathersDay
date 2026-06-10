;==============================================================================
; extinguisher.asm
;
; Extinguisher spray, fuel consumption, and refill stations.
; Bank 2 module.
;
; Fire button + spray consumes FUEL_SPRAY_COST per frame.
; Wall refill stations restore FUEL_REFILL_AMOUNT on contact.
; Not implemented — stub only.
;==============================================================================

UpdateExtinguisher
    ; TODO M6: if fire pressed and fuel > 0, set PLAYER_FLAG_SPRAYING
    ; TODO M6: deplete extinguisherFuel while spraying
    ; TODO M6: hit test spray vs active fires in fireTable
    ; TODO M6: check refill station collision in current room
    rts
