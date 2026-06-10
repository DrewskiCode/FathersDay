;==============================================================================
; audio.asm
;
; Sound effect and music driver.
; Bank 2 module (triggers) + Bank 3 data (AUDC/AUDF/AUDV tables).
;
; Drives TIA audio registers during overscan only.
; Not implemented — stub only.
;==============================================================================

UpdateAudio
    ; TODO M6: spray loop sound → AUDC0/AUDF0/AUDV0
    ; TODO M5: fire crackle on active fires
    ; TODO M7: score chime one-shot
    ; TODO M9: explosion on game over
    rts

PlaySound
    ; A = SOUND_* event ID
    ; TODO: set audioFlags and load params from Bank 3 sound table
    rts
