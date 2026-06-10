;==============================================================================
; main.asm — Pyro Pyro Master Build File (F6SC / 16 KB Melody Board)
;==============================================================================

    include "include/assembly.config.asm"

;--- Bank 0: full game core at CPU $F100 --------------------------------------
    ORG     $0000
    RORG    $F000
    ds      $100, $FF

    ORG     $0100
    RORG    CODE_START
    include "banks/bank0.asm"

    ORG     $0FFC
    RORG    $FFFC
    .word   Reset, Reset

;--- Bank 1: reset trampoline + future title assets ---------------------------
    ORG     $1000
    RORG    $F000
    ds      $100, $FF

    ORG     $1100
    RORG    CODE_START
    include "common/cold_start.asm"
    include "banks/bank1.asm"

    ORG     $1FFC
    RORG    $FFFC
    .word   Reset, Reset

;--- Bank 2: reset trampoline + gameplay module copies (future CallBank2) -----
    ORG     $2000
    RORG    $F000
    ds      $100, $FF

    ORG     $2100
    RORG    CODE_START
    include "common/cold_start.asm"
    include "banks/bank2.asm"

    ORG     $2FFC
    RORG    $FFFC
    .word   Reset, Reset

;--- Bank 3: reset trampoline only (all assets are in bank 0) -----------------
    ORG     $3000
    RORG    $F000
    ds      $100, $FF

    ORG     $3100
    RORG    CODE_START
    include "common/cold_start.asm"
    include "banks/bank3.asm"

    ORG     $3FFC
    RORG    $FFFC
    .word   Reset, Reset

    END
