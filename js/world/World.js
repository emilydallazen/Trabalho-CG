import * as THREE from "three";
import { WORLD_CONFIG } from "../config/constants.js";

export class World {
  constructor(scene) {
    this.scene = scene;
    this.createGround();
  }
  
  createGround() {
    const loader = new THREE.TextureLoader();
    
    const grassTex = loader.load(
      "../assets/textures/grass/Grass008_1K-JPG_Color.jpg",
      (texture) => {
        console.log("Textura de grama carregada com sucesso");
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(20, 20);
        texture.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.error("Erro ao carregar textura de grama:", error);
      }
    );

    grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(20, 20);

    const groundMaterial = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.8,
      metalness: 0.2,
    });

    const groundGeometry = new THREE.PlaneGeometry(
      WORLD_CONFIG.GROUND_SIZE, 
      WORLD_CONFIG.GROUND_SIZE
    );
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    this.scene.add(ground);
    this.ground = ground;
  }
  
  addObject(object) {
    this.scene.add(object);
  }
  
  async loadModel(path, position = { x: 0, y: 0, z: 0 }) {
    console.log(`Carregando modelo: ${path}`);
  }
}
