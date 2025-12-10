/**
 * Função smoothstep para transições suaves
 * @param {number} min - valor mínimo
 * @param {number} max - valor máximo  
 * @param {number} value - valor atual
 * @returns {number} valor suavizado entre 0 e 1
 */
export function smoothstep(min, max, value) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

/**
 * Converte posição angular para coordenadas 3D em órbita circular
 * @param {number} angle - ângulo em radianos
 * @param {number} radius - raio da órbita
 * @returns {object} coordenadas x, y, z
 */
export function angleToPosition(angle, radius) {
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    z: 0
  };
}

/**
 * Gera número aleatório entre min e max
 * @param {number} min - valor mínimo
 * @param {number} max - valor máximo
 * @returns {number} número aleatório
 */
export function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Gera posição aleatória em esfera
 * @param {number} radius - raio da esfera
 * @param {boolean} upperHalf - se true, apenas hemisfério superior
 * @returns {object} coordenadas x, y, z
 */
export function randomSpherePosition(radius, upperHalf = false) {
  const theta = Math.random() * Math.PI * 2;
  const phi = upperHalf 
    ? Math.acos(Math.random() * 0.8 + 0.1)
    : Math.acos(Math.random() * 2 - 1);
  
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return { 
    x, 
    y: upperHalf ? Math.abs(y) : y, 
    z 
  };
}
