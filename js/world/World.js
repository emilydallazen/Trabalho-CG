import * as THREE from "../three/three.module.js";
import { OBJLoader } from "../three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "../three/examples/jsm/loaders/MTLLoader.js";
import { WORLD_CONFIG } from "../config/constants.js";

export class World {
  constructor(scene) {
    this.scene = scene;
    this.cityObjects = [];
    this.windmill = null;
    this.lanterns = [];
    this.lanternLights = [];
    this.collisionObjects = [];
    this.currentSound = null;
    this.audioListener = null;
    this.musicTracks = [];
    this.currentTrackIndex = 0;
    this.createGround();
    this.loadCityObjects();
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

  createLanternLight(position, index = 0) {
    const light = new THREE.PointLight(0xFFB366, 15.0, 60);
    light.position.set(position.x, position.y + 3, position.z);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 30;
    this.scene.add(light);
    this.lanternLights.push(light);
  }

  update(delta) {
    if (this.windmill) {
      this.windmill.rotation.x += delta * 0.5;
    }

    this.lanternLights.forEach((light, index) => {
      const timeOffset = index * 0.5;
      const flickerIntensity = 15.0 + 
        Math.sin((performance.now() + timeOffset * 1000) * 0.003) * 2.0 + 
        Math.random() * 1.0;
      light.intensity = flickerIntensity;
    });
  }

  async loadCityObjects() {
    const cityObjectsToLoad = [
      {
        name: 'fountain-round',
        position: { x: 10, y: 0, z: 10 },
        scale: 2
      },
      {
        name: 'lantern',
        position: { x: -20, y: 0, z: 0 },
        scale: 3.0
      },
      {
        name: 'lantern',
        position: { x: -12, y: 0, z: 0 },
        scale: 3.0
      },
      {
        name: 'lantern',
        position: { x: -4, y: 0, z: 0 },
        scale: 3.0
      },
      {
        name: 'lantern',
        position: { x: 4, y: 0, z: 0 },
        scale: 3.0
      },
      {
        name: 'lantern',
        position: { x: 12, y: 0, z: 0 },
        scale: 3.0
      },
      {
        name: 'tree-high',
        position: { x: 15, y: 0, z: -8 },
        scale: 1.8
      },
      {
        name: 'windmill',
        position: { x: -12, y: 5, z: -15 },
        scale: 2.5
      },
      {
        name: 'stall-red',
        position: { x: 5, y: 0, z: -5 },
        scale: 1.2
      }
    ];

    for (const objConfig of cityObjectsToLoad) {
      try {
        await this.loadOBJWithMTL(objConfig.name, objConfig.position, objConfig.scale);
      } catch (error) {
        console.error(`Erro ao carregar objeto ${objConfig.name}:`, error);
      }
    }
  }

  async loadOBJWithMTL(objectName, position = { x: 0, y: 0, z: 0 }, scale = 1) {
    return new Promise((resolve, reject) => {
      const basePath = `./assets/city/OBJ format/`;
      const mtlPath = `${basePath}${objectName}.mtl`;
      const objPath = `${basePath}${objectName}.obj`;

      const mtlLoader = new MTLLoader();
      mtlLoader.setPath(basePath);
      mtlLoader.setResourcePath(basePath);

      mtlLoader.load(
        mtlPath,
        (materials) => {
          materials.preload();

          for (const materialName in materials.materials) {
            const material = materials.materials[materialName];

            if (material.map) {
              material.map.needsUpdate = true;
              material.map.flipY = false;
              material.map.colorSpace = THREE.SRGBColorSpace;
            }

            material.side = THREE.FrontSide;
            material.transparent = material.opacity < 1.0;
            material.needsUpdate = true;

            if (materialName.toLowerCase().includes('water')) {
              material.transparent = true;
              material.opacity = 0.7;
            }
          }

          const objLoader = new OBJLoader();
          objLoader.setMaterials(materials);

          objLoader.load(
            objPath,
            (object) => {
              object.position.set(position.x, position.y, position.z);
              object.scale.setScalar(scale);

              object.traverse((child) => {
                if (child.isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;

                  if (child.material && !child.material.map) {
                    child.material.color.setHex(0x8B4513);
                  }

                  if (child.material) {
                    child.material.needsUpdate = true;
                  }
                }
              });

              this.scene.add(object);
              this.cityObjects.push(object);

              this.addCollisionObject(object, objectName, position, scale);

              if (objectName === 'windmill') {
                this.windmill = object;
              }

              if (objectName === 'lantern') {
                this.lanterns.push(object);
                this.createLanternLight(position, this.lanterns.length - 1);
              }

              resolve(object);
            },
            undefined,
            (error) => {
              console.error(`Erro ao carregar OBJ ${objectName}:`, error);
              reject(error);
            }
          );
        },
        undefined,
        (error) => {
          console.error(`Erro ao carregar MTL ${objectName}:`, error);
          this.loadOBJOnly(objectName, position, scale).then(resolve).catch(reject);
        }
      );
    });
  }

  async loadOBJOnly(objectName, position = { x: 0, y: 0, z: 0 }, scale = 1) {
    return new Promise((resolve, reject) => {
      const basePath = `./assets/city/OBJ format/`;
      const objPath = `${basePath}${objectName}.obj`;

      const objLoader = new OBJLoader();
      objLoader.load(
        objPath,
        (object) => {
          object.position.set(position.x, position.y, position.z);
          object.scale.setScalar(scale);

          const materialConfig = this.getMaterialForObject(objectName);

          object.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial(materialConfig);
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          this.scene.add(object);
          this.cityObjects.push(object);

          this.addCollisionObject(object, objectName, position, scale);

          if (objectName === 'windmill') {
            this.windmill = object;
          }

          if (objectName === 'lantern') {
            this.lanterns.push(object);
            this.createLanternLight(position, this.lanterns.length - 1);
          }

          resolve(object);
        },
        undefined,
        (error) => {
          console.error(`Erro ao carregar OBJ ${objectName}:`, error);
          reject(error);
        }
      );
    });
  }

  addCollisionObject(object, objectName, position, scale) {
    const collisionSizes = {
      'fountain-round': { width: 4, height: 2, depth: 4 },
      'lantern': { width: 1.5, height: 4, depth: 1.5 },
      'tree-high': { width: 3, height: 8, depth: 3 },
      'windmill': { width: 4, height: 10, depth: 4 },
      'stall-red': { width: 3, height: 3, depth: 2 },
      'default': { width: 2, height: 2, depth: 2 }
    };

    let size = collisionSizes.default;
    for (const [key, config] of Object.entries(collisionSizes)) {
      if (objectName.includes(key)) {
        size = config;
        break;
      }
    }

    const scaledSize = {
      width: size.width * scale,
      height: size.height * scale,
      depth: size.depth * scale
    };

    const collisionObject = {
      name: objectName,
      position: { ...position },
      size: scaledSize,
      containsPoint: function(x, z) {
        const halfWidth = this.size.width / 2;
        const halfDepth = this.size.depth / 2;

        return (x >= this.position.x - halfWidth && 
                x <= this.position.x + halfWidth &&
                z >= this.position.z - halfDepth && 
                z <= this.position.z + halfDepth);
      }
    };

    this.collisionObjects.push(collisionObject);
  }

  checkCollision(x, z, playerRadius = 0.5) {
    for (const collisionObj of this.collisionObjects) {
      const expandedHalfWidth = (collisionObj.size.width / 2) + playerRadius;
      const expandedHalfDepth = (collisionObj.size.depth / 2) + playerRadius;

      if (x >= collisionObj.position.x - expandedHalfWidth && 
          x <= collisionObj.position.x + expandedHalfWidth &&
          z >= collisionObj.position.z - expandedHalfDepth && 
          z <= collisionObj.position.z + expandedHalfDepth) {
        return true; 
      }
    }
    return false; 
  }

  getCollidingObject(x, z, playerRadius = 0.5) {
    for (const collisionObj of this.collisionObjects) {
      const expandedHalfWidth = (collisionObj.size.width / 2) + playerRadius;
      const expandedHalfDepth = (collisionObj.size.depth / 2) + playerRadius;

      if (x >= collisionObj.position.x - expandedHalfWidth && 
          x <= collisionObj.position.x + expandedHalfWidth &&
          z >= collisionObj.position.z - expandedHalfDepth && 
          z <= collisionObj.position.z + expandedHalfDepth) {
        return collisionObj;
      }
    }
    return null;
  }

  getMaterialForObject(objectName) {
    const materialConfigs = {
      'fountain': { color: 0x87CEEB, roughness: 0.1, metalness: 0.8 },
      'lantern': { color: 0xFFD700, roughness: 0.3, metalness: 0.9 },
      'tree': { color: 0x228B22, roughness: 0.9, metalness: 0.0 },
      'windmill': { color: 0x8B4513, roughness: 0.7, metalness: 0.1 },
      'stall': { color: 0xDC143C, roughness: 0.6, metalness: 0.2 },
      'wall': { color: 0x696969, roughness: 0.8, metalness: 0.0 },
      'roof': { color: 0x8B0000, roughness: 0.7, metalness: 0.0 },
      'wood': { color: 0x8B4513, roughness: 0.8, metalness: 0.0 },
      'stone': { color: 0x708090, roughness: 0.9, metalness: 0.0 },
      'default': { color: 0x888888, roughness: 0.7, metalness: 0.1 }
    };

    for (const [key, config] of Object.entries(materialConfigs)) {
      if (objectName.toLowerCase().includes(key)) {
        return config;
      }
    }

    return materialConfigs.default;
  }

  getCollisionDebugInfo() {
    return {
      totalObjects: this.collisionObjects.length,
      objects: this.collisionObjects.map(obj => ({
        name: obj.name,
        position: obj.position,
        size: obj.size
      }))
    };
  }

  async loadModel(path, position = { x: 0, y: 0, z: 0 }) {
    console.log(`Carregando modelo: ${path}`);
  }

  initAudioSystem(musicPaths, camera) {
    this.audioListener = new THREE.AudioListener();
    camera.add(this.audioListener);

    const audioLoader = new THREE.AudioLoader();

    musicPaths.forEach((path, index) => {
      audioLoader.load(path, (buffer) => {
        const sound = new THREE.Audio(this.audioListener);
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.3);
        this.musicTracks.push(sound);

        if (index === 0) {
          this.currentSound = sound;
          this.setupAudioPlayback();
        }
      }, undefined, (error) => {
        console.error(`Erro ao carregar música ${path}:`, error);
      });
    });

    this.setupMusicControls();
  }

  setupAudioPlayback() {
    const playAudio = () => {
      if (this.currentSound && !this.currentSound.isPlaying) {
        this.currentSound.play().catch((error) => {
          console.log('Aguardando interação do usuário para tocar áudio:', error);
        });
      }
      document.removeEventListener('click', playAudio);
      document.removeEventListener('keydown', playAudio);
    };

    document.addEventListener('click', playAudio);
    document.addEventListener('keydown', playAudio);
    
    console.log('Sistema de áudio carregado. Clique na tela ou pressione uma tecla para começar.');
  }

  setupMusicControls() {
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Digit1') {
        this.nextTrack();
      }
    });
  }

  nextTrack() {
    if (this.musicTracks.length === 0) return;

    if (this.currentSound && this.currentSound.isPlaying) {
      this.currentSound.stop();
    }

    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicTracks.length;
    this.currentSound = this.musicTracks[this.currentTrackIndex];

    if (this.currentSound) {
      this.currentSound.play().catch((error) => {
        console.log('Erro ao trocar música:', error);
      });
      console.log(`Tocando música ${this.currentTrackIndex + 1} de ${this.musicTracks.length}`);
    }
  }
}
