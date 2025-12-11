// Constantes gerais do projeto
export const GAME_CONFIG = {
  SPEED: 50.0,
  DAY_DURATION: 60, // duração do dia em segundos
  CLOUD_COUNT: 15,
};

export const CAMERA_CONFIG = {
  FOV: 75,
  NEAR: 0.1,
  FAR: 500,
  INITIAL_POSITION: { x: 0, y: 1.7, z: 0 } // Altura de uma pessoa (1.7m)
};

export const LIGHTING_CONFIG = {
  SUN_INTENSITY: 1.2,
  AMBIENT_INTENSITY: 0.2,
  MOON_INTENSITY: 0.3,
  SHADOW_MAP_SIZE: 2048
};

export const WORLD_CONFIG = {
  GROUND_SIZE: 500,
  SUN_ORBIT_RADIUS: 200,
  STAR_COUNT: 2000,
  STAR_DISTANCE: 400
};

export const MOVEMENT_KEYS = {
  FORWARD: 'KeyW',
  BACKWARD: 'KeyS',
  LEFT: 'KeyA',
  RIGHT: 'KeyD'
};

export const COLORS = {
  // Cores do sol
  NIGHT_SUN: { h: 0.6, s: 0.8, l: 0.2 },
  SUNSET_SUN: { h: 0.08, s: 0.9, l: 0.8 },
  DAY_SUN: { h: 0.12, s: 0.15, l: 1.0 },
  
  // Cores ambiente
  NIGHT_AMBIENT: { h: 0.65, s: 0.7, l: 0.3 },
  SUNSET_AMBIENT: { h: 0.08, s: 0.4, l: 0.6 },
  DAY_AMBIENT: { h: 0.6, s: 0.1, l: 0.9 },
  
  // Cores do céu
  NIGHT_SKY: { h: 0.65, s: 0.9, l: 0.05 },
  SUNSET_SKY: { h: 0.08, s: 0.8, l: 0.4 },
  DAY_SKY: { h: 0.58, s: 0.7, l: 0.8 }
};
