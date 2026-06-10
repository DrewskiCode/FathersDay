;==============================================================================
; tables.asm
;
; General lookup tables: score-to-difficulty mapping, etc.
; Bank 3 — read-only data. (DirDeltaX/Y live in Bank 0 input.asm.)
;==============================================================================

; Difficulty tier score thresholds (mirrors constants.asm for table lookup)
DifficultyThresholds
    word    DIFFICULTY_TIER1_SCORE
    word    DIFFICULTY_TIER2_SCORE
    word    DIFFICULTY_TIER3_SCORE

; Score values per fire stage (for quick lookup in M7)
ScoreValues
    byte    0                   ; FIRE_STAGE_NONE
    byte    SCORE_YELLOW
    byte    SCORE_ORANGE
    byte    SCORE_RED

SpecialScoreValues
    byte    SCORE_PURPLE        ; FIRE_TYPE_PURPLE
    byte    SCORE_GREEN         ; FIRE_TYPE_GREEN
