;==============================================================================
; constants.asm — gameplay tuning values from SPEC.md (column-0 equates)
;==============================================================================

SCORE_YELLOW          = 100
SCORE_ORANGE          = 100
SCORE_RED             = 100
SCORE_PURPLE          = 200
SCORE_GREEN           = 200

FUEL_MAX              = 255
FUEL_START            = 128
FUEL_SPRAY_COST       = 1
FUEL_REFILL_AMOUNT    = 255

FIRE_STAGE_YELLOW_FRAMES  = 180
FIRE_STAGE_ORANGE_FRAMES  = 120
FIRE_CRITICAL_RED_FRAMES  = 300
POWERUP_DURATION_FRAMES   = 1800
SPECIAL_FIRE_CHECK_INTERVAL = 600

DIFFICULTY_TIER1_SCORE = 500
DIFFICULTY_TIER2_SCORE = 1500
DIFFICULTY_TIER3_SCORE = 3000

SPAWN_INTERVAL_TIER0  = 300
SPAWN_INTERVAL_TIER1  = 240
SPAWN_INTERVAL_TIER2  = 180
SPAWN_INTERVAL_TIER3  = 120

PLAYER_SPEED          = 1
PLAYER_MIN_X          = 8
PLAYER_MAX_X          = 151
PLAYER_MIN_Y          = 40
PLAYER_MAX_Y          = 176

; Room door thresholds (horizontal screen-edge transitions)
DOOR_EDGE_X           = 6         ; past this X triggers west exit
DOOR_EDGE_X_RIGHT     = 153       ; past this X triggers east exit
SPAWN_CENTER_FROM_L   = 24        ; entering center from left room
SPAWN_CENTER_FROM_R   = 135       ; entering center from right room
SPAWN_SIDE_FROM_C     = 130         ; entering side room from center (near inner door)
SPAWN_SIDE_INNER      = 20          ; X when side room, near center door

COMPUTERS_PER_ROOM    = 5         ; target count per screen (M4)
COMPUTER_HIT_W        = 8
COMPUTER_HIT_H        = 10
PLAYER_SPRITE_W       = 8
PLAYER_SPRITE_H       = 8

SCORE_ROW_Y           = 8
PLAYFIELD_TOP         = 32
TITLE_BLINK_FRAMES    = 30
TITLE_FLAME_FRAMES    = 8
TITLE_ROW_PROMPT      = $80       ; high bit on row count = gated by titlePromptVisible

GAME_VERSION_MAJOR    = 0
GAME_VERSION_MINOR    = 1
