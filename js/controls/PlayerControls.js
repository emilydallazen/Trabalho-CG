import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { MOVEMENT_KEYS, GAME_CONFIG } from "../config/constants.js";

export class PlayerControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, domElement);
    
    // Estado do movimento
    this.moveState = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };
    
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    
    this.setupEventListeners();
    this.createInstructions();
  }
  
  setupEventListeners() {
    const onKeyDown = (event) => {
      switch (event.code) {
        case MOVEMENT_KEYS.FORWARD:
          this.moveState.forward = true;
          break;
        case MOVEMENT_KEYS.LEFT:
          this.moveState.left = true;
          break;
        case MOVEMENT_KEYS.BACKWARD:
          this.moveState.backward = true;
          break;
        case MOVEMENT_KEYS.RIGHT:
          this.moveState.right = true;
          break;
      }
    };

    const onKeyUp = (event) => {
      switch (event.code) {
        case MOVEMENT_KEYS.FORWARD:
          this.moveState.forward = false;
          break;
        case MOVEMENT_KEYS.LEFT:
          this.moveState.left = false;
          break;
        case MOVEMENT_KEYS.BACKWARD:
          this.moveState.backward = false;
          break;
        case MOVEMENT_KEYS.RIGHT:
          this.moveState.right = false;
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
  }
  
  createInstructions() {
    this.instructions = document.createElement("div");
    this.instructions.style.position = "absolute";
    this.instructions.style.top = "50%";
    this.instructions.style.left = "50%";
    this.instructions.style.transform = "translate(-50%, -50%)";
    this.instructions.style.padding = "20px";
    this.instructions.style.backgroundColor = "rgba(0,0,0,0.7)";
    this.instructions.style.color = "white";
    this.instructions.style.fontFamily = "Arial";
    this.instructions.style.textAlign = "center";
    this.instructions.innerHTML =
      "<h2>Clique para jogar</h2><p>WASD para mover<br>Mouse para olhar<br>ESC para sair</p>";
    
    document.body.appendChild(this.instructions);

    this.instructions.addEventListener("click", () => {
      this.controls.lock();
    });

    this.controls.addEventListener("lock", () => {
      this.instructions.style.display = "none";
    });

    this.controls.addEventListener("unlock", () => {
      this.instructions.style.display = "block";
    });
  }
  
  update(delta) {
    if (!this.controls.isLocked) return;
    
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    this.direction.z = Number(this.moveState.forward) - Number(this.moveState.backward);
    this.direction.x = Number(this.moveState.right) - Number(this.moveState.left);
    this.direction.normalize();

    if (this.moveState.forward || this.moveState.backward) {
      this.velocity.z -= this.direction.z * GAME_CONFIG.SPEED * delta;
    }
    if (this.moveState.left || this.moveState.right) {
      this.velocity.x -= this.direction.x * GAME_CONFIG.SPEED * delta;
    }

    this.controls.moveRight(-this.velocity.x * delta);
    this.controls.moveForward(-this.velocity.z * delta);
  }
  
  getControls() {
    return this.controls;
  }
}
