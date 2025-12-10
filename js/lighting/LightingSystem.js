import * as THREE from "three";
import { GAME_CONFIG, LIGHTING_CONFIG, COLORS, WORLD_CONFIG } from "../config/constants.js";
import { smoothstep, angleToPosition } from "../utils/math.js";

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;
    this.dayTime = 0;
    
    this.setupLights();
    this.setupCelestialBodies();
  }
  
  setupLights() {
    this.sun = new THREE.DirectionalLight(0xffffff, LIGHTING_CONFIG.SUN_INTENSITY);
    this.sun.position.set(50, 80, 50);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = LIGHTING_CONFIG.SHADOW_MAP_SIZE;
    this.sun.shadow.mapSize.height = LIGHTING_CONFIG.SHADOW_MAP_SIZE;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 500;
    this.sun.shadow.camera.left = -100;
    this.sun.shadow.camera.right = 100;
    this.sun.shadow.camera.top = 100;
    this.sun.shadow.camera.bottom = -100;
    this.scene.add(this.sun);

    this.ambient = new THREE.AmbientLight(0x404040, LIGHTING_CONFIG.AMBIENT_INTENSITY);
    this.scene.add(this.ambient);

    this.moonLight = new THREE.DirectionalLight(0x8899bb, LIGHTING_CONFIG.MOON_INTENSITY);
    this.moonLight.castShadow = false;
    this.scene.add(this.moonLight);
  }
  
  setupCelestialBodies() {
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5
    });
    this.sunSphere = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sunSphere);

    const moonGeometry = new THREE.SphereGeometry(3, 32, 32);
    const moonMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xccccdd,
      emissive: 0x444466,
      emissiveIntensity: 0.3
    });
    this.moonSphere = new THREE.Mesh(moonGeometry, moonMaterial);
    this.scene.add(this.moonSphere);
  }
  
  update(delta) {
    this.dayTime += delta / GAME_CONFIG.DAY_DURATION;
    if (this.dayTime > 1) this.dayTime -= 1;

    this.updateSun();
    this.updateMoon();
    this.updateColors();
  }
  
  updateSun() {
    const sunAngle = this.dayTime * Math.PI * 2;
    const sunPos = angleToPosition(sunAngle, WORLD_CONFIG.SUN_ORBIT_RADIUS);
    
    this.sun.position.set(sunPos.x, sunPos.y, sunPos.z);
    this.sun.target.position.set(0, 0, 0);
    this.sun.target.updateMatrixWorld();

    this.sunSphere.position.copy(this.sun.position);
    
    this.sunSphere.visible = sunPos.y > -10;
    
    const sunHeight = Math.sin(sunAngle);
    const dayIntensity = Math.max(0, sunHeight);
    this.sun.intensity = dayIntensity * LIGHTING_CONFIG.SUN_INTENSITY;
  }
  
  updateMoon() {
    const sunAngle = this.dayTime * Math.PI * 2;
    const moonAngle = sunAngle + Math.PI; // Oposta ao sol
    const moonPos = angleToPosition(moonAngle, WORLD_CONFIG.SUN_ORBIT_RADIUS);
    
    this.moonSphere.position.set(moonPos.x, moonPos.y, moonPos.z);
    this.moonLight.position.set(moonPos.x, moonPos.y, moonPos.z);
    this.moonLight.target.position.set(0, 0, 0);
    this.moonLight.target.updateMatrixWorld();
    
    const moonHeight = Math.sin(moonAngle);
    const sunHeight = Math.sin(sunAngle);
    const isNight = sunHeight < 0.1;
    
    this.moonSphere.visible = moonPos.y > -10 && moonHeight > -0.2;
    
    if (isNight && moonHeight > 0) {
      const nightIntensity = Math.max(0, moonHeight);
      this.moonLight.intensity = nightIntensity * 0.25;
      
      const moonBrightness = 0.3 + nightIntensity * 0.3;
      this.moonSphere.material.emissiveIntensity = moonBrightness;
      
      const moonLuminosity = 0.7 + nightIntensity * 0.3;
      this.moonSphere.material.color.setHSL(0.65, 0.1, moonLuminosity);
    } else {
      this.moonLight.intensity = 0;
      this.moonSphere.material.emissiveIntensity = 0.1;
      this.moonSphere.material.color.setHSL(0.65, 0.05, 0.8);
    }
    
    this.updateLunarPhases();
  }
  
  updateLunarPhases() {
    const lunarPhase = (this.dayTime * 28) % 1;
    const phaseIntensity = Math.sin(lunarPhase * Math.PI * 2) * 0.5 + 0.5;
    
    if (this.moonSphere.visible) {
      const currentEmissive = this.moonSphere.material.emissiveIntensity;
      this.moonSphere.material.emissiveIntensity = currentEmissive * (0.6 + phaseIntensity * 0.4);
    }
  }
  
  updateColors() {
    const sunAngle = this.dayTime * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    const dayIntensity = Math.max(0, sunHeight);
    const nightIntensity = Math.max(0, -sunHeight * 0.1);
    
    this.ambient.intensity = Math.max(0.05, dayIntensity * 0.4 + nightIntensity);
    
    const { sunColor, ambientColor, skyColor } = this.interpolateColors(sunHeight);
    
    this.sun.color.setHSL(sunColor.h, sunColor.s, sunColor.l);
    this.ambient.color.setHSL(ambientColor.h, ambientColor.s, ambientColor.l);
    this.scene.background.setHSL(skyColor.h, skyColor.s, skyColor.l);
  }
  
  interpolateColors(sunHeight) {
    let sunColor, ambientColor, skyColor;
    
    if (sunHeight < 0) {
      const t = smoothstep(-0.3, 0, sunHeight);
      sunColor = this.lerpColors(COLORS.NIGHT_SUN, COLORS.SUNSET_SUN, t);
      ambientColor = this.lerpColors(COLORS.NIGHT_AMBIENT, COLORS.SUNSET_AMBIENT, t);
      skyColor = this.lerpColors(COLORS.NIGHT_SKY, COLORS.SUNSET_SKY, smoothstep(-0.4, 0, sunHeight));
    } else {
      const t = smoothstep(0, 0.3, sunHeight);
      sunColor = this.lerpColors(COLORS.SUNSET_SUN, COLORS.DAY_SUN, t);
      ambientColor = this.lerpColors(COLORS.SUNSET_AMBIENT, COLORS.DAY_AMBIENT, t);
      skyColor = this.lerpColors(COLORS.SUNSET_SKY, COLORS.DAY_SKY, smoothstep(0, 0.4, sunHeight));
    }
    
    return { sunColor, ambientColor, skyColor };
  }
  
  lerpColors(colorA, colorB, t) {
    return {
      h: colorA.h + (colorB.h - colorA.h) * t,
      s: colorA.s + (colorB.s - colorA.s) * t,
      l: colorA.l + (colorB.l - colorA.l) * t
    };
  }
  
  getDayTime() {
    return this.dayTime;
  }
  
  getSunHeight() {
    return Math.sin(this.dayTime * Math.PI * 2);
  }
  
  getDayIntensity() {
    return Math.max(0, this.getSunHeight());
  }
}
