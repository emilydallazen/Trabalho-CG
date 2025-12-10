import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let scene, camera, renderer, controls;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const speed = 50.0;

// Variáveis para o ciclo dia/noite
let sun, ambient;
let dayTime = 0; // 0 = meia-noite, 0.5 = meio-dia
const dayDuration = 60; // duração do dia em segundos
let sunSphere; // esfera visual do sol
let moonSphere; // esfera visual da lua
let moonLight; // luz da lua
let stars; // campo de estrelas
let clouds = []; // array de nuvens
const cloudCount = 15; // número de nuvens

export function init() {
  // ===== CÂMERA =====
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(0, 10, 0);

  // ===== CENA =====
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa8d0ff);

  // ===== RENDERER =====
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // ===== CONTROLES =====
  controls = new PointerLockControls(camera, document.body);

  // Instruções e pointer lock
  const instructions = document.createElement("div");
  instructions.style.position = "absolute";
  instructions.style.top = "50%";
  instructions.style.left = "50%";
  instructions.style.transform = "translate(-50%, -50%)";
  instructions.style.padding = "20px";
  instructions.style.backgroundColor = "rgba(0,0,0,0.7)";
  instructions.style.color = "white";
  instructions.style.fontFamily = "Arial";
  instructions.style.textAlign = "center";
  instructions.innerHTML =
    "<h2>Clique para jogar</h2><p>WASD para mover<br>Mouse para olhar<br>ESC para sair</p>";
  document.body.appendChild(instructions);

  instructions.addEventListener("click", () => {
    controls.lock();
  });

  controls.addEventListener("lock", () => {
    instructions.style.display = "none";
  });

  controls.addEventListener("unlock", () => {
    instructions.style.display = "block";
  });

  // Event listeners para teclado
  const onKeyDown = (event) => {
    switch (event.code) {
      case "KeyW":
        moveForward = true;
        break;
      case "KeyA":
        moveLeft = true;
        break;
      case "KeyS":
        moveBackward = true;
        break;
      case "KeyD":
        moveRight = true;
        break;
    }
  };

  const onKeyUp = (event) => {
    switch (event.code) {
      case "KeyW":
        moveForward = false;
        break;
      case "KeyA":
        moveLeft = false;
        break;
      case "KeyS":
        moveBackward = false;
        break;
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  // ===== LUZ =====
  sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(50, 80, 50);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 500;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  scene.add(sun);

  ambient = new THREE.AmbientLight(0x404040, 0.2);
  scene.add(ambient);

  // ===== SOL VISUAL =====
  const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffff00,
    emissive: 0xffaa00,
    emissiveIntensity: 0.5
  });
  sunSphere = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sunSphere);

  // ===== LUA VISUAL =====
  const moonGeometry = new THREE.SphereGeometry(3, 32, 32);
  const moonMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xccccdd,
    emissive: 0x444466,
    emissiveIntensity: 0.3
  });
  moonSphere = new THREE.Mesh(moonGeometry, moonMaterial);
  scene.add(moonSphere);

  // ===== LUZ DA LUA =====
  moonLight = new THREE.DirectionalLight(0x8899bb, 0.3);
  moonLight.castShadow = false;
  scene.add(moonLight);

  // ===== ESTRELAS =====
  createStars();

  // ===== NUVENS =====
  createClouds();

  // ===== TEXTURA DE GRAMA =====
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

  // ===== CHÃO =====
  const groundMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.8,
    metalness: 0.2,
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ===== LOOP =====
  animate();

  window.addEventListener("resize", onResize);
}

let prevTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  updateDayNightCycle(delta);


  updateClouds(delta);

  if (controls.isLocked === true) {
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
  }

  prevTime = time;

  renderer.render(scene, camera);
}

function updateDayNightCycle(delta) {
  dayTime += delta / dayDuration;
  if (dayTime > 1) dayTime -= 1; 

  const sunAngle = dayTime * Math.PI * 2;
  const sunRadius = 200;
  
  const sunX = Math.cos(sunAngle) * sunRadius;
  const sunY = Math.sin(sunAngle) * sunRadius;
  const sunZ = 0;

  sun.position.set(sunX, sunY, sunZ);
  sun.target.position.set(0, 0, 0);
  sun.target.updateMatrixWorld();

  sunSphere.position.copy(sun.position);

  // ===== ATUALIZA LUA =====
  updateMoon(sunAngle, sunRadius);

  const sunHeight = Math.sin(sunAngle); 
  const dayIntensity = Math.max(0, sunHeight); 
  const nightIntensity = Math.max(0, -sunHeight * 0.1); 

  sun.intensity = dayIntensity * 1.2;
  ambient.intensity = Math.max(0.05, dayIntensity * 0.4 + nightIntensity);

  updateLightingColors(dayIntensity, sunHeight);

  sunSphere.visible = sunY > -10; 

  if (stars) {
    const starOpacity = Math.max(0, 1 - dayIntensity * 2);
    stars.material.opacity = starOpacity;
    stars.visible = starOpacity > 0.1;
  }
}

function createStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 2000;
  
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  
  for (let i = 0; i < starCount; i++) {
    const radius = 400 + Math.random() * 100;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.8 + 0.1); 
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = Math.abs(y); 
    positions[i * 3 + 2] = z;
    
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
  
  stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

function createClouds() {
  const loader = new GLTFLoader();
  
  // Carrega o modelo 3D da nuvem
  loader.load(
    '../assets/cloud/cloud.gltf', // Caminho para seu modelo de nuvem
    (gltf) => {
      console.log('Modelo de nuvem carregado com sucesso');
      
      // Cria múltiplas instâncias do modelo
      for (let i = 0; i < cloudCount; i++) {
        const cloud = gltf.scene.clone();
        
        // Posição inicial aleatória
        cloud.position.set(
          (Math.random() - 0.5) * 800, // x: -400 a 400
          60 + Math.random() * 80,     // y: 60 a 140 (altura das nuvens)
          (Math.random() - 0.5) * 800  // z: -400 a 400
        );
        
        // Escala aleatória para variedade
        const scale = 5.0 + Math.random() * 1.0; // 0.5 a 1.5
        cloud.scale.setScalar(scale);
        
        // Rotação inicial aleatória
        cloud.rotation.y = Math.random() * Math.PI * 2;
        
        // Velocidade aleatória para cada nuvem
        cloud.userData.velocity = {
          x: (Math.random() - 0.5) * 2, // -1 a 1
          z: (Math.random() - 0.5) * 2
        };
        
        // Aplica material transparente se necessário
        cloud.traverse((child) => {
          if (child.isMesh) {
            child.material.transparent = true;
            child.material.opacity = 0.8;
            child.receiveShadow = true;
            child.castShadow = true;
          }
        });
        
        clouds.push(cloud);
        scene.add(cloud);
      }
    },
    (progress) => {
      console.log('Carregando nuvem:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
      console.error('Erro ao carregar modelo de nuvem:', error);
      console.log('Usando nuvens procedurais como fallback...');
      
      createProceduralClouds();
    }
  );
}

function createProceduralClouds() {
  for (let i = 0; i < cloudCount; i++) {
    const cloud = createSingleCloud();
    
    cloud.position.set(
      (Math.random() - 0.5) * 800, 
      60 + Math.random() * 80,     
      (Math.random() - 0.5) * 800 
    );
    

    cloud.userData.velocity = {
      x: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 2
    };
    
    clouds.push(cloud);
    scene.add(cloud);
  }
}

function createSingleCloud() {
  const cloudGroup = new THREE.Group();
  
  const sphereCount = 8 + Math.random() * 6; 
  
  for (let i = 0; i < sphereCount; i++) {
    const sphereGeometry = new THREE.SphereGeometry(
      5 + Math.random() * 8,
      8,
      6
    );
    
    const sphereMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    sphere.position.set(
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 25
    );
    
    cloudGroup.add(sphere);
  }

  const scale = 0.8 + Math.random() * 0.6; 
  cloudGroup.scale.setScalar(scale);
  
  return cloudGroup;
}

function updateClouds(delta) {
  clouds.forEach(cloud => {
    cloud.position.x += cloud.userData.velocity.x * delta * 5;
    cloud.position.z += cloud.userData.velocity.z * delta * 5;
    
    const maxDistance = 450;
    if (Math.abs(cloud.position.x) > maxDistance || Math.abs(cloud.position.z) > maxDistance) {
      if (Math.abs(cloud.position.x) > maxDistance) {
        cloud.position.x = -Math.sign(cloud.position.x) * maxDistance;
      }
      if (Math.abs(cloud.position.z) > maxDistance) {
        cloud.position.z = -Math.sign(cloud.position.z) * maxDistance;
      }
    }
    
    cloud.rotation.y += delta * 0.02;
    
    updateCloudColors(cloud);
  });
}

function updateCloudColors(cloud) {
  const sunAngle = dayTime * Math.PI * 2;
  const sunHeight = Math.sin(sunAngle);
  const dayIntensity = Math.max(0, sunHeight);
  
  const smoothstep = (min, max, value) => {
    const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return t * t * (3 - 2 * t);
  };
  
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

function updateLightingColors(dayIntensity, sunHeight) {
  const smoothstep = (min, max, value) => {
    const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return t * t * (3 - 2 * t);
  };

  const sunsetFactor = smoothstep(-0.3, 0.1, sunHeight); 
  const dayFactor = smoothstep(0.0, 0.3, sunHeight);
  const nightFactor = 1 - smoothstep(-0.5, 0.0, sunHeight);

  const nightSunColor = { h: 0.6, s: 0.8, l: 0.2 }; 
  const sunsetSunColor = { h: 0.08, s: 0.9, l: 0.8 }; 
  const daySunColor = { h: 0.12, s: 0.15, l: 1.0 }; 

  const nightAmbientColor = { h: 0.65, s: 0.7, l: 0.3 };
  const sunsetAmbientColor = { h: 0.08, s: 0.4, l: 0.6 };
  const dayAmbientColor = { h: 0.6, s: 0.1, l: 0.9 };

  const nightSkyColor = { h: 0.65, s: 0.9, l: 0.05 }; 
  const sunsetSkyColor = { h: 0.08, s: 0.8, l: 0.4 }; 
  const daySkyColor = { h: 0.58, s: 0.7, l: 0.8 }; 

  let sunH, sunS, sunL;
  if (sunHeight < 0) {
    const t = smoothstep(-0.3, 0, sunHeight);
    sunH = nightSunColor.h + (sunsetSunColor.h - nightSunColor.h) * t;
    sunS = nightSunColor.s + (sunsetSunColor.s - nightSunColor.s) * t;
    sunL = nightSunColor.l + (sunsetSunColor.l - nightSunColor.l) * t;
  } else {
    const t = smoothstep(0, 0.3, sunHeight);
    sunH = sunsetSunColor.h + (daySunColor.h - sunsetSunColor.h) * t;
    sunS = sunsetSunColor.s + (daySunColor.s - sunsetSunColor.s) * t;
    sunL = sunsetSunColor.l + (daySunColor.l - sunsetSunColor.l) * t;
  }

  let ambH, ambS, ambL;
  if (sunHeight < 0) {
    const t = smoothstep(-0.3, 0, sunHeight);
    ambH = nightAmbientColor.h + (sunsetAmbientColor.h - nightAmbientColor.h) * t;
    ambS = nightAmbientColor.s + (sunsetAmbientColor.s - nightAmbientColor.s) * t;
    ambL = nightAmbientColor.l + (sunsetAmbientColor.l - nightAmbientColor.l) * t;
  } else {
    const t = smoothstep(0, 0.3, sunHeight);
    ambH = sunsetAmbientColor.h + (dayAmbientColor.h - sunsetAmbientColor.h) * t;
    ambS = sunsetAmbientColor.s + (dayAmbientColor.s - sunsetAmbientColor.s) * t;
    ambL = sunsetAmbientColor.l + (dayAmbientColor.l - sunsetAmbientColor.l) * t;
  }

  let skyH, skyS, skyL;
  if (sunHeight < 0) {
    const t = smoothstep(-0.4, 0, sunHeight);
    skyH = nightSkyColor.h + (sunsetSkyColor.h - nightSkyColor.h) * t;
    skyS = nightSkyColor.s + (sunsetSkyColor.s - nightSkyColor.s) * t;
    skyL = nightSkyColor.l + (sunsetSkyColor.l - nightSkyColor.l) * t;
  } else {
    const t = smoothstep(0, 0.4, sunHeight);
    skyH = sunsetSkyColor.h + (daySkyColor.h - sunsetSkyColor.h) * t;
    skyS = sunsetSkyColor.s + (daySkyColor.s - sunsetSkyColor.s) * t;
    skyL = sunsetSkyColor.l + (daySkyColor.l - sunsetSkyColor.l) * t;
  }

  sun.color.setHSL(sunH, sunS, sunL);
  ambient.color.setHSL(ambH, ambS, ambL);
  scene.background.setHSL(skyH, skyS, skyL);
}

function updateMoon(sunAngle, sunRadius) {
  const moonAngle = sunAngle + Math.PI;
  
  const moonX = Math.cos(moonAngle) * sunRadius;
  const moonY = Math.sin(moonAngle) * sunRadius;
  const moonZ = 0;
  
  moonSphere.position.set(moonX, moonY, moonZ);
  
  moonLight.position.set(moonX, moonY, moonZ);
  moonLight.target.position.set(0, 0, 0);
  moonLight.target.updateMatrixWorld();
  
  const moonHeight = Math.sin(moonAngle);
  const nightIntensity = Math.max(0, moonHeight); 
  moonSphere.visible = moonY > -10 && moonHeight > -0.2;
  

  const sunHeight = Math.sin(sunAngle);
  const isNight = sunHeight < 0.1;
  
  if (isNight && moonHeight > 0) {
    moonLight.intensity = nightIntensity * 0.25;
    
    const moonBrightness = 0.3 + nightIntensity * 0.3;
    moonSphere.material.emissiveIntensity = moonBrightness;
    
    const moonLuminosity = 0.7 + nightIntensity * 0.3;
    moonSphere.material.color.setHSL(0.65, 0.1, moonLuminosity);
  } else {
    moonLight.intensity = 0;
    moonSphere.material.emissiveIntensity = 0.1;
    moonSphere.material.color.setHSL(0.65, 0.05, 0.8);
  }

  const lunarPhase = (dayTime * 28) % 1;
  const phaseIntensity = Math.sin(lunarPhase * Math.PI * 2) * 0.5 + 0.5;
  
  if (moonSphere.visible) {
    const currentEmissive = moonSphere.material.emissiveIntensity;
    moonSphere.material.emissiveIntensity = currentEmissive * (0.6 + phaseIntensity * 0.4);
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
