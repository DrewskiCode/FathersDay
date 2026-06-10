;==============================================================================
; variables.asm
;
; RAM symbol definitions for Pyro Pyro.
; Maps every named variable to its Superchip or zero-page address.
; See docs/MEMORY_MAP.md for the full allocation table.
;
; Superchip convention: define WRITE address; add SC_READ_OFFSET for reads.
;==============================================================================

;==============================================================================
; Zero Page — kernel use only ($A0–$FF, above TIA mirrors at $80–$9F)
;==============================================================================
            SEG.U   ZEROPAGE
            ORG     $A0

pfrow       ds      2       ; Playfield row pointer (kernel)
temp1       ds      2       ; General kernel temporary
scanline    ds      1       ; Current scanline (0–262)
kernelState ds      1       ; Active kernel mode (KERNEL_MODE_*)
stateCache  ds      1       ; ZP copy of gameState (dispatch only — no SC read)
spritePtr   ds      2       ; Pointer into sprite data (Bank 3)
frameTemps  ds      16      ; Vblank scratch (not preserved line-to-line)

;==============================================================================
; Superchip RAM — game state ($F000–$F07F write port)
;==============================================================================
            SEG.U   SUPERCHIP
            ORG     SC_WRITE_BASE

; --- System / Frame ---
gameState       ds  1       ; STATE_TITLE | STATE_PLAYING | STATE_GAMEOVER
frameCounter    ds  1       ; Increments every frame
quarterFrame    ds  1       ; Sub-frame timer
randSeed        ds  1       ; LFSR random seed
score           ds  2       ; Current score (16-bit)
highScore       ds  2       ; Session high score
titleFlameFrame     ds  1   ; 0/1 — selects title playfield flame pattern
titlePromptVisible  ds  1   ; 1 = show "Press Fire" playfield cue
titleFireLock       ds  1   ; debounce: wait for release after start
sysReserved         ds  5   ; Reserved system bytes

; --- Player ---
playerX         ds  1       ; Horizontal position
playerY         ds  1       ; Vertical position
playerDir       ds  1       ; DIR_* enumeration
playerFlags     ds  1       ; PLAYER_FLAG_* bits
extinguisherFuel ds 1      ; 0–255 fuel level
powerUpTimer    ds  1       ; Frames remaining for purple power-up
playerReserved  ds  10      ; Reserved player bytes

; --- Fire table (MAX_FIRES × FIRE_RECORD_SIZE = 32 bytes) ---
fireTable       ds  MAX_FIRES * FIRE_RECORD_SIZE

; Fire system globals
activeFireCount ds  1       ; Number of active fire slots
spawnTimer      ds  1       ; Countdown to next spawn attempt
difficultyTier  ds  1       ; Current difficulty level (0–3)
fireReserved    ds  13      ; Reserved fire bytes

; --- Office / World ---
currentRoom     ds  1       ; ROOM_LEFT | ROOM_CENTER | ROOM_RIGHT
inputDir        ds  1       ; DIR_* from ReadInput (0 = none)
inputFire       ds  1       ; 1 = fire button held (INPT4)
roomFlags       ds  1       ; Room state bitfield
mapCursor       ds  2       ; Map traversal temp
officeReserved  ds  26      ; Padding (was 28)

; --- Audio / Misc ---
audioFlags      ds  1       ; Active sound bits
audioFrame      ds  1       ; Sound sequencer tick
miscReserved    ds  14      ; Padding to fill 128 bytes

; Verify we used exactly 128 bytes of Superchip RAM
            IF      . > SC_WRITE_BASE + SC_RAM_SIZE
                echo "ERROR: Superchip RAM overflow!"
            ENDIF

; Per-fire field offsets — defined at column 0 for DASM
FIRE_OFF_FLAGS  = 0
FIRE_OFF_X      = 1
FIRE_OFF_Y      = 2
FIRE_OFF_TIMER  = 3
ROOM_RECORD_SIZE = 4
