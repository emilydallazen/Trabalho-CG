import * as THREE from "three";
import { WORLD_CONFIG } from "../config/constants.js";
import { randomSpherePosition } from "../utils/math.js";

export class StarSystem {
  constructor(scene) {
    this.scene = scene;
    this.stars = null;
    this.createStars();
  }
  
  createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = WORLD_CONFIG.STAR_COUNT;
    
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      const radius = WORLD_CONFIG.STAR_DISTANCE + Math.random() * 100;
      const pos = randomSpherePosition(radius, true);
      
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      
      const colorVariation = Math.random();
      if (colorVariation < 0.7) {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
      } else if (colorVariation < 0.85) {
        colors[i * 3] = 0.8;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 1;
      } else {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 0.8;
      }
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      sizeAttenuation: false,
      blending: THREE.AdditiveBlending
    });
    
    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }
  
  update(dayIntensity) {
    if (!this.stars) return;
    
    const starOpacity = Math.max(0, 1 - dayIntensity * 2);
    this.stars.material.opacity = starOpacity;
    this.stars.visible = starOpacity > 0.1;
  }
}
