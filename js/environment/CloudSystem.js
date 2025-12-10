import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GAME_CONFIG } from "../config/constants.js";
import { randomBetween } from "../utils/math.js";
import { smoothstep } from "../utils/math.js";

export class CloudSystem {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.loader = new GLTFLoader();
    this.createClouds();
  }
  
  createClouds() {
    this.loader.load(
      '../assets/cloud/cloud.gltf',
      (gltf) => {
        console.log('Modelo de nuvem carregado com sucesso');
        this.create3DClouds(gltf);
      },
      (progress) => {
        console.log('Carregando nuvem:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Erro ao carregar modelo de nuvem:', error);
        console.log('Usando nuvens procedurais como fallback...');
        this.createProceduralClouds();
      }
    );
  }
  
  create3DClouds(gltf) {
    for (let i = 0; i < GAME_CONFIG.CLOUD_COUNT; i++) {
      const cloud = gltf.scene.clone();
      this.setupCloudProperties(cloud);
      this.clouds.push(cloud);
      this.scene.add(cloud);
    }
  }
  
  createProceduralClouds() {
    for (let i = 0; i < GAME_CONFIG.CLOUD_COUNT; i++) {
      const cloud = this.createSingleCloud();
      this.setupCloudProperties(cloud);
      this.clouds.push(cloud);
      this.scene.add(cloud);
    }
  }
  
  setupCloudProperties(cloud) {
    cloud.position.set(
      randomBetween(-400, 400),  
      randomBetween(60, 140),    
      randomBetween(-400, 400)  
    );
    
    const scale = randomBetween(1.5, 2.5);
    cloud.scale.setScalar(scale);

    cloud.rotation.y = Math.random() * Math.PI * 2;
    
    cloud.userData.velocity = {
      x: randomBetween(-1, 1),
      z: randomBetween(-1, 1)
    };
    
    cloud.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = true;
        child.material.opacity = 0.8;
        child.receiveShadow = true;
        child.castShadow = true;
      }
    });
  }
  
  createSingleCloud() {
    const cloudGroup = new THREE.Group();
    const sphereCount = randomBetween(8, 14);
    
    for (let i = 0; i < sphereCount; i++) {
      const sphereGeometry = new THREE.SphereGeometry(
        randomBetween(8, 20),
        8,
      );
      
      const sphereMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
      });
      
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      
      sphere.position.set(
        randomBetween(-20, 20),
        randomBetween(-6, 6),
        randomBetween(-20, 20)
      );
      
      cloudGroup.add(sphere);
    }

    return cloudGroup;
  }
  
  update(delta, dayTime) {
    this.clouds.forEach(cloud => {
      cloud.position.x += cloud.userData.velocity.x * delta * 5;
      cloud.position.z += cloud.userData.velocity.z * delta * 5;
      
      this.wrapCloudPosition(cloud);

      cloud.rotation.y += delta * 0.02;

      this.updateCloudColors(cloud, dayTime);
    });
  }
  
  wrapCloudPosition(cloud) {
    const maxDistance = 450;
    
    if (Math.abs(cloud.position.x) > maxDistance) {
      cloud.position.x = -Math.sign(cloud.position.x) * maxDistance;
    }
    if (Math.abs(cloud.position.z) > maxDistance) {
      cloud.position.z = -Math.sign(cloud.position.z) * maxDistance;
    }
  }
  
  updateCloudColors(cloud, dayTime) {
    const sunAngle = dayTime * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    
    let cloudColor, cloudOpacity;
    
    if (sunHeight > 0.1) {
      cloudColor = new THREE.Color(0xffffff);
      cloudOpacity = 0.9;
    } else if (sunHeight > -0.1) {
      const t = smoothstep(-0.1, 0.1, sunHeight);
      cloudColor = new THREE.Color().setHSL(0.05, 0.3, 0.7 + t * 0.3);
      cloudOpacity = 0.8 + t * 0.1;
    } else {
      cloudColor = new THREE.Color(0x333366);
      cloudOpacity = 0.3;
    }
    
    cloud.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach(material => {
          if (material.color) {
            material.color.copy(cloudColor);
          }
          if (material.transparent !== undefined) {
            material.opacity = cloudOpacity;
          }
        });
      }
    });
  }
}
