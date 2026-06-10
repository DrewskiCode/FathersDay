export const VIEW_W = 320;
export const VIEW_H = 240;

export const PLAYER_W = 12;
export const PLAYER_H = 16;
export const PLAYER_SPEED = 90;
/** Top speed after holding one direction (~45% ramp over PLAYER_RAMP_SEC). */
export const PLAYER_MAX_SPEED = 115;
export const PLAYER_RAMP_SEC = 0.45;
export const WALL_THICK = 8;

export const EXTINGUISHER_MAX_USES = 10;
export const EXTINGUISHER_RELOAD_SEC = 3;
/** Distance from player center to wall station center to show reload prompt. */
export const EXTINGUISHER_STATION_RANGE = 28;

export const SPRAY_DURATION_SEC = 1;
export const SPRAY_RANGE = 52;

export const FIRE_YELLOW_SEC = 10;
export const FIRE_ORANGE_SEC = 10;
export const FIRE_RED_EXPLODE_SEC = 15;

/** Fires off-screen progress at half speed (2× longer per stage). */
export const OFF_ROOM_FIRE_RATE = 0.5;

export const POWERUP_DURATION_SEC = 30;
export const SPECIAL_FIRE_INTERVAL = 5;
export const SCORE_RAINBOW = 1555;
export const SCORE_SPECIAL = 200;
export const SCORE_NORMAL = 100;
export const SCORE_COIN = 50;

export const COMBO_WINDOW_SEC = 7;
export const COFFEE_BOOST_SEC = 5;
export const COFFEE_SPEED_MULT = 3;
export const COFFEE_SPAWN_CHANCE = 0.33;

export const NPC_W = 10;
export const NPC_H = 14;
/** Calm walk between desks. */
export const NPC_PATROL_SPEED = 22;
/** Panic run when near a yellow fire. */
export const NPC_RUN_YELLOW = 58;
/** Panic run boost for orange / red fires. */
export const NPC_RUN_URGENT = 84;
export const NPC_FALLEN_SEC = 5;
/** Distance from desk center to trigger panic. */
export const NPC_FIRE_DETECT_RANGE = 46;
