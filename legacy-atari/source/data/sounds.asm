;==============================================================================
; sounds.asm
;
; TIA audio parameter tables for sound effects.
; Bank 3 — read-only data consumed by audio.asm during overscan.
;
; Each sound entry: AUDC (control), AUDF (frequency), AUDV (volume)
; Not implemented — placeholder silent entries until M6/M7 audio pass.
;==============================================================================

SoundTable
    ; SOUND_NONE
    byte    0, 0, 0
    ; SOUND_SPRAY
    byte    $0E, $0, $4        ; white noise spray — tune in M6
    ; SOUND_FIRE_CRACKLE
    byte    $0E, $4, $3
    ; SOUND_REFILL
    byte    $06, $8, $6        ; pure tone chime
    ; SOUND_POWERUP
    byte    $0A, $6, $8
    ; SOUND_SCORE
    byte    $06, $4, $6
    ; SOUND_EXPLOSION
    byte    $0E, $2, $8

SOUND_ENTRY_SIZE    = 3
SoundTableSize      = . - SoundTable
