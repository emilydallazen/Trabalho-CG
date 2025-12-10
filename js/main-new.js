import * as THREE from "./three/three.module.js";
import { CAMERA_CONFIG } from "./config/constants.js";
import { PlayerControls } from "./controls/PlayerControls.js";
import { LightingSystem } from "./lighting/LightingSystem.js";
import { StarSystem } from "./environment/StarSystem.js";
import { CloudSystem } from "./environment/CloudSystem.js";
import { World } from "./world/World.js";

class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.playerControls = null;
    this.lightingSystem = null;
    this.starSystem = null;
    this.cloudSystem = null;
    this.world = null;
    
    this.prevTime = performance.now();
  }
  
  init() {
    this.setupCamera();
    this.setupScene();
    this.setupRenderer();
    this.setupSystems();
    this.setupEventListeners();
    this.animate();
  }
  
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.FOV,
      window.innerWidth / window.innerHeight,
      CAMERA_CONFIG.NEAR,
      CAMERA_CONFIG.FAR
    );
    
    const pos = CAMERA_CONFIG.INITIAL_POSITION;
    this.camera.position.set(pos.x, pos.y, pos.z);
  }
  
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa8d0ff);
  }
  
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);
  }
  
  setupSystems() {
    this.lightingSystem = new LightingSystem(this.scene);
    this.starSystem = new StarSystem(this.scene);
    this.cloudSystem = new CloudSystem(this.scene);
    this.world = new World(this.scene);
    
    this.playerControls = new PlayerControls(this.camera, document.body, this.world);

    const musicTracks = [
      './assets/theme.mp3',
      './assets/theme2.mp3'
    ];
    this.world.initAudioSystem(musicTracks, this.camera);
  }
  
  setupEventListeners() {
    window.addEventListener("resize", () => this.onResize());
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const time = performance.now();
    const delta = (time - this.prevTime) / 1000;
    
    this.update(delta);
    this.render();
    
    this.prevTime = time;
  }
  
  update(delta) {
    // Atualiza todos os sistemas
    this.playerControls.update(delta);
    this.lightingSystem.update(delta);
    this.world.update(delta);
    
    // Sistemas que dependem de informações do lighting
    const dayIntensity = this.lightingSystem.getDayIntensity();
    const dayTime = this.lightingSystem.getDayTime();
    
    this.starSystem.update(dayIntensity);
    this.cloudSystem.update(delta, dayTime);
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

export function init() {
  const game = new Game();
  game.init();
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init);
}
