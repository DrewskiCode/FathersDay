;==============================================================================
; cold_start.asm
;
; F6 reset trampoline — MUST be byte-identical at CODE_START ($F100) in every
; bank. All banks currently mirror bank 0 body, so no hotspot read is needed
; on cold boot (that read was confusing Stella into a black screen).
;
; Layout: 7 bytes (F100–F106), then bank_slot_f107.asm at $F107.
;==============================================================================

Reset
    sei
    jmp     ResetBank0
    nop
    nop
    nop
