import * as THREE from "../three/three.module.js";
import { PointerLockControls } from "https://unpkg.com/three@0.170.0/examples/jsm/controls/PointerLockControls.js";
import { MOVEMENT_KEYS, GAME_CONFIG } from "../config/constants.js";

export class PlayerControls {
  constructor(camera, domElement, world = null) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, domElement);
    this.world = world;

    this.moveState = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    this.playerHeight = 1.7;
    this.groundHeight = 1.7;
    this.jumpVelocity = 0;
    this.jumpStrength = 8;
    this.gravity = -20;
    this.isGrounded = true;

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
        case 'Space':
          if (this.isGrounded) {
            this.jump();
          }
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
        case 'Space':
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
      "<h2>Clique para jogar</h2><p>WASD para mover<br>Mouse para olhar<br>ESPAÇO para pular<br>1 para trocar música<br>ESC para sair</p>";

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

  jump() {
    if (this.isGrounded) {
      this.jumpVelocity = this.jumpStrength;
      this.isGrounded = false;
    }
  }

  escapeFromCollision() {
    const currentX = this.camera.position.x;
    const currentZ = this.camera.position.z;

    const collidingObject = this.world.getCollidingObject(currentX, currentZ);

    if (collidingObject) {
      const dirX = currentX - collidingObject.position.x;
      const dirZ = currentZ - collidingObject.position.z;

      const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
      const normalizedDirX = length > 0 ? dirX / length : 1;
      const normalizedDirZ = length > 0 ? dirZ / length : 0;

      const escapeDistance = Math.max(
        (collidingObject.size.width / 2) + 0.6,
        (collidingObject.size.depth / 2) + 0.6
      );

      const newX = collidingObject.position.x + normalizedDirX * escapeDistance;
      const newZ = collidingObject.position.z + normalizedDirZ * escapeDistance;

      if (!this.world.checkCollision(newX, newZ)) {
        this.camera.position.x = newX;
        this.camera.position.z = newZ;
      } else {
        const fallbackDirections = [
          { x: 0.5, z: 0 }, { x: -0.5, z: 0 }, 
          { x: 0, z: 0.5 }, { x: 0, z: -0.5 }
        ];

        for (const dir of fallbackDirections) {
          const testX = currentX + dir.x;
          const testZ = currentZ + dir.z;

          if (!this.world.checkCollision(testX, testZ)) {
            this.camera.position.x = testX;
            this.camera.position.z = testZ;
            break;
          }
        }
      }
    }
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

    if (this.world && this.world.checkCollision) {
      const currentX = this.camera.position.x;
      const currentZ = this.camera.position.z;

      if (this.world.checkCollision(currentX, currentZ)) {
        this.escapeFromCollision();
      } else {
        const newX = currentX - this.velocity.x * delta;
        const newZ = currentZ - this.velocity.z * delta;

        if (!this.world.checkCollision(newX, currentZ)) {
          this.controls.moveRight(-this.velocity.x * delta);
        } else {
          this.velocity.x = 0;
        }

        if (!this.world.checkCollision(currentX, newZ)) {
          this.controls.moveForward(-this.velocity.z * delta);
        } else {
          this.velocity.z = 0;
        }
      }
    } else {
      this.controls.moveRight(-this.velocity.x * delta);
      this.controls.moveForward(-this.velocity.z * delta);
    }

    if (!this.isGrounded) {
      this.jumpVelocity += this.gravity * delta;
    }

    this.playerHeight += this.jumpVelocity * delta;

    if (this.playerHeight <= this.groundHeight) {
      this.playerHeight = this.groundHeight;
      this.jumpVelocity = 0;
      this.isGrounded = true;
    }

    this.camera.position.y = this.playerHeight;
  }

  getControls() {
    return this.controls;
  }
}
