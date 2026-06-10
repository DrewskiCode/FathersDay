;==============================================================================
; enums.asm — named game state and flag enumerations (column-0 equates)
;==============================================================================

STATE_TITLE        = 0
STATE_PLAYING      = 1
STATE_GAMEOVER     = 2

FIRE_STAGE_NONE    = 0
FIRE_STAGE_YELLOW  = 1
FIRE_STAGE_ORANGE  = 2
FIRE_STAGE_RED     = 3

FIRE_TYPE_NORMAL   = 0
FIRE_TYPE_PURPLE   = 1
FIRE_TYPE_GREEN    = 2

FIRE_FLAG_ACTIVE   = %10000000
FIRE_FLAG_SPECIAL  = %01000000

DIR_NONE           = 0
DIR_N              = 1
DIR_NE             = 2
DIR_E              = 3
DIR_SE             = 4
DIR_S              = 5
DIR_SW             = 6
DIR_W              = 7
DIR_NW             = 8

PLAYER_FLAG_MOVING    = %00000001
PLAYER_FLAG_SPRAYING  = %00000010
PLAYER_FLAG_POWERED   = %00000100

KERNEL_MODE_TITLE     = 0
KERNEL_MODE_GAME      = 1
KERNEL_MODE_GAMEOVER  = 2

SOUND_NONE            = 0
SOUND_SPRAY           = 1
SOUND_FIRE_CRACKLE    = 2
SOUND_REFILL          = 3
SOUND_POWERUP         = 4
SOUND_SCORE           = 5
SOUND_EXPLOSION       = 6

MIN_ROOMS             = 3
MAX_ROOMS             = 3
NUM_ROOMS_V1          = 3

ROOM_LEFT             = 0
ROOM_CENTER           = 1
ROOM_RIGHT            = 2
START_ROOM            = ROOM_CENTER

MAX_FIRES             = 8
FIRE_RECORD_SIZE      = 4
