;==============================================================================
; assembly.config.asm
;
; Global assembler configuration for Pyro Pyro.
; Included once at the top of main.asm before any bank layout.
;
; Sets the target CPU (6507), pulls in standard Atari support headers from
; the bundled DASM distribution, and includes project-wide definitions.
;==============================================================================

; DASM macro.h optional switch — use legal opcodes only (safer for beginners)
NO_ILLEGAL_OPCODES   = 1

    processor 6502    ; 6507 is a masked 6502 — DASM uses 6502 opcode set

    include "vcs.h"
    include "macro.h"

; Project includes (order matters: hardware → enums → constants → variables)
    include "hardware.asm"
    include "enums.asm"
    include "constants.asm"
    include "variables.asm"

; Return to default code segment — variables.asm ends in SEG.U SUPERCHIP
    SEG
    ORG     0

; Audio mute macro (used by startup and kernel)
    include "common/silence_audio.asm"
