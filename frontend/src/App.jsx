const { useState, useEffect, useRef, useMemo } = React;

// ==========================================================
// 1. EXTENDED WEB AUDIO API SOUNDSCAPE SYNTH ENGINE
// ==========================================================
let audioCtx = null;
let trafficNode = null;
let trafficGain = null;

let rainNode = null;
let rainGain = null;

let birdsInterval = null;
let sfxEnabled = true;

// Volume levels (0.0 to 1.0)
let trafficVol = 0.5;
let rainVol = 0.0;
let birdsVol = 0.4;
let bellsVol = 0.5;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

const toggleSFX = (enabled) => {
  sfxEnabled = enabled;
  updateAmbientVolumes();
};

const updateAmbientVolumes = () => {
  if (!sfxEnabled) {
    if (trafficGain) trafficGain.gain.setValueAtTime(0, getAudioContext().currentTime);
    if (rainGain) rainGain.gain.setValueAtTime(0, getAudioContext().currentTime);
  } else {
    if (trafficGain) trafficGain.gain.setValueAtTime(trafficVol * 0.06, getAudioContext().currentTime);
    if (rainGain) rainGain.gain.setValueAtTime(rainVol * 0.1, getAudioContext().currentTime);
  }
};

const setTrafficVolume = (vol) => {
  trafficVol = vol;
  updateAmbientVolumes();
};

const setRainVolume = (vol) => {
  rainVol = vol;
  updateAmbientVolumes();
};

const setBirdsVolume = (vol) => {
  birdsVol = vol;
};

const setBellsVolume = (vol) => {
  bellsVol = vol;
};

// Resonant multi-oscillator temple bell additive synthesis
const playTempleBell = () => {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(bellsVol * 0.5, now + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
    masterGain.connect(ctx.destination);
    
    const freqs = [220, 440, 554, 659, 880];
    const gains = [0.4, 0.25, 0.15, 0.1, 0.05];
    
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      oscGain.gain.setValueAtTime(gains[idx], now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + (3.2 / (idx + 1)));
      
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      
      osc.start(now);
      osc.stop(now + 4.5);
    });
  } catch (e) {
    console.warn("Audio Context blocked or not supported:", e);
  }
};

// Continuous Lowpass Noise generator for Traffic Rumble
const startTrafficHum = () => {
  if (trafficNode) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    
    trafficGain = ctx.createGain();
    trafficGain.gain.setValueAtTime(sfxEnabled ? trafficVol * 0.06 : 0, now);
    
    noise.connect(filter);
    filter.connect(trafficGain);
    trafficGain.connect(ctx.destination);
    
    noise.start(now);
    trafficNode = noise;
  } catch (e) {}
};

const stopTrafficHum = () => {
  if (trafficNode) {
    try {
      trafficNode.stop();
    } catch(e) {}
    trafficNode = null;
  }
};

// Continuous Bandpass Noise generator for Rain Static
const startRainHum = () => {
  if (rainNode) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(0.7, now);
    
    rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(sfxEnabled ? rainVol * 0.1 : 0, now);
    
    noise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(ctx.destination);
    
    noise.start(now);
    rainNode = noise;
  } catch (e) {}
};

const stopRainHum = () => {
  if (rainNode) {
    try {
      rainNode.stop();
    } catch(e) {}
    rainNode = null;
  }
};

// Random pitch-sweeping sine oscillator triggers for Birds
const triggerBirdChirp = () => {
  if (!sfxEnabled || birdsVol <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const chirps = Math.floor(Math.random() * 2) + 2;
    let time = now;
    
    for (let i = 0; i < chirps; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      const startFreq = 2600 + Math.random() * 600;
      const endFreq = startFreq + 900 + Math.random() * 300;
      
      osc.frequency.setValueAtTime(startFreq, time);
      osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.08);
      osc.frequency.exponentialRampToValueAtTime(startFreq - 150, time + 0.13);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(birdsVol * 0.04, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + 0.14);
      
      time += 0.12 + Math.random() * 0.1;
    }
  } catch (e) {}
};

const startAmbientBirds = () => {
  if (birdsInterval) return;
  birdsInterval = setInterval(() => {
    if (Math.random() < 0.35) {
      triggerBirdChirp();
    }
  }, 4000);
};

const stopAmbientBirds = () => {
  if (birdsInterval) {
    clearInterval(birdsInterval);
    birdsInterval = null;
  }
};

// Synth UI Interaction Triggers
const playUIClick = () => {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  } catch (e) {}
};

const playUIHover = () => {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    
    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch (e) {}
};

const playSuccessChime = () => {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.075;
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  } catch (e) {}
};

// ==========================================================
// 2. VOICE SYNTHESIS ALERT ENGINE
// ==========================================================
let voiceMuted = false;
const setVoiceMuted = (muted) => {
  voiceMuted = muted;
  if (voiceMuted && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

const speakAlert = (text, lang = 'en') => {
  if (voiceMuted) return;
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    if (lang === 'ta') {
      utterance.lang = 'ta-IN';
      selectedVoice = voices.find(v => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'));
    }
    
    if (!selectedVoice) {
      utterance.lang = 'en-IN';
      selectedVoice = voices.find(v => v.lang.startsWith('en') && (v.lang.includes('IN') || v.lang.includes('US') || v.lang.includes('GB')));
    }
    
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.pitch = 1.05;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch (e) {}
};

// ==========================================================
// 3. THREE.JS 3D ENVIRONMENT SCENE COMPONENT (VANILLA THREE)
// ==========================================================
const MylaporeScene = ({ hour, weather, congestionLevel, parkingOccupancies, cameraMode, source, destination }) => {
  const getParkCol = (rate) => {
    if (rate > 85) return 0xef4444;
    if (rate > 60) return 0xffb000;
    return 0x22c55e;
  };

  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());

  // Refs for animated structures
  const vehiclesRef = useRef([]);
  const firefliesRef = useRef(null);
  const rainRef = useRef(null);
  const cloudsRef = useRef(null);
  const birdsRef = useRef(null);
  const pedestriansRef = useRef([]);
  
  // Refs for parking zones
  const parkingZoneARef = useRef(null);
  const parkingZoneBRef = useRef(null);
  const parkingZoneCRef = useRef(null);
  
  // Lights
  const ambientLightRef = useRef(null);
  const dirLightRef = useRef(null);
  const streetLightPointLights = useRef([]);
  const streetLightBulbs = useRef([]);
  const shopLights = useRef([]);

  const isNight = hour < 6 || hour > 18;

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Ambient fog selection based on night vs weather
    const fogCol = isNight ? 0x020617 : 0x050b18;
    scene.background = new THREE.Color(fogCol);
    scene.fog = new THREE.FogExp2(fogCol, 0.018);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 250);
    camera.position.set(0, 16, 38);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights Setups
    const ambientLight = new THREE.AmbientLight(0xffffff, isNight ? 0.08 : 0.45);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(0xffffff, isNight ? 0.08 : 1.25);
    dirLight.position.set(25, 45, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // CyberGrid blueprint map floor
    const gridHelper = new THREE.GridHelper(100, 100, 0x00E5FF, 0x1e293b);
    gridHelper.position.y = 0.005;
    scene.add(gridHelper);

    // Build Kapaleeshwarar Temple gopuram + sacred tank structure
    const templeGroup = new THREE.Group();
    templeGroup.position.set(-18, 0, -6);
    scene.add(templeGroup);

    // Lake tank
    const tankGeo = new THREE.PlaneGeometry(16, 12);
    const tankMat = new THREE.MeshStandardMaterial({
      color: 0x0f766e,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.8
    });
    const tankMesh = new THREE.Mesh(tankGeo, tankMat);
    tankMesh.rotation.x = -Math.PI / 2;
    tankMesh.position.set(0, 0.02, 11);
    templeGroup.add(tankMesh);

    // Lake Steps border
    const stepsGeo = new THREE.RingGeometry(8, 8.4, 4);
    const stepsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const stepsMesh = new THREE.Mesh(stepsGeo, stepsMat);
    stepsMesh.rotation.x = -Math.PI / 2;
    stepsMesh.position.set(0, 0.05, 11);
    templeGroup.add(stepsMesh);

    // Temple Main Gopuram
    const tiers = [
      { size: [4.4, 1.4, 5.4], pos: [0, 0.7, 0], color: 0x5a3d28 },
      { size: [3.8, 1.2, 4.8], pos: [0, 2.0, 0], color: 0xa14d26 },
      { size: [3.2, 1.0, 4.2], pos: [0, 3.1, 0], color: 0xc86d38 },
      { size: [2.6, 0.9, 3.6], pos: [0, 4.05, 0], color: 0xe09d5f },
      { size: [2.0, 0.8, 3.0], pos: [0, 4.9, 0], color: 0xf4b26f },
      { size: [1.4, 0.7, 2.4], pos: [0, 5.65, 0], color: 0xf4926f },
      { size: [0.8, 0.6, 1.8], pos: [0, 6.3, 0], color: 0xd91429 }
    ];

    tiers.forEach(t => {
      const boxGeo = new THREE.BoxGeometry(...t.size);
      const boxMat = new THREE.MeshStandardMaterial({ color: t.color, roughness: 0.82 });
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      boxMesh.position.set(...t.pos);
      templeGroup.add(boxMesh);
    });

    // Gold Kalasam spires
    const kalasams = new THREE.Group();
    kalasams.position.y = 6.6;
    templeGroup.add(kalasams);
    const kalasamMat = new THREE.MeshStandardMaterial({ color: 0xFFB000, metalness: 0.9, roughness: 0.1 });
    
    for (let k = -2; k <= 2; k++) {
      const kMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.18, 0.35, 8), kalasamMat);
      kMesh.position.x = k * 0.35;
      kalasams.add(kMesh);
      const kTip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), kalasamMat);
      kTip.position.set(k * 0.35, 0.18, 0);
      kalasams.add(kTip);
    }

    // Glowing gate entrance
    const gateGeo = new THREE.BoxGeometry(1.6, 0.9, 0.05);
    const gateMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
    const gateMesh = new THREE.Mesh(gateGeo, gateMat);
    gateMesh.position.set(0, 0.45, 2.72);
    templeGroup.add(gateMesh);

    const gateLight = new THREE.PointLight(0x00E5FF, 3.5, 6);
    gateLight.position.set(0, 0.9, 3.0);
    templeGroup.add(gateLight);

    // Build Santhome Church gothic cathedral block on right side
    const churchGroup = new THREE.Group();
    churchGroup.position.set(22, 0, -12);
    scene.add(churchGroup);

    const churchBase = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 10), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 }));
    churchBase.position.y = 1.5;
    churchGroup.add(churchBase);

    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 1.2, 7, 4), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 }));
    spire.position.set(0, 6.5, 3.5);
    churchGroup.add(spire);

    const crossVert = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    crossVert.position.set(0, 10.5, 3.5);
    churchGroup.add(crossVert);

    const crossHoriz = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    crossHoriz.position.set(0, 10.8, 3.5);
    churchGroup.add(crossHoriz);

    // Spire light glow
    const spireLight = new THREE.PointLight(0xffffff, 2.5, 10);
    spireLight.position.set(0, 10.5, 3.5);
    churchGroup.add(spireLight);

    // Build Roads (Asphalt + lanes)
    const nsRoad = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 100), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }));
    nsRoad.rotation.x = -Math.PI / 2;
    nsRoad.position.y = 0.01;
    scene.add(nsRoad);

    const nsLine = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 100), new THREE.MeshStandardMaterial({ color: 0xffb000, roughness: 1.0 }));
    nsLine.rotation.x = -Math.PI / 2;
    nsLine.position.y = 0.015;
    scene.add(nsLine);

    const ewRoad = new THREE.Mesh(new THREE.PlaneGeometry(100, 3.0), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }));
    ewRoad.rotation.x = -Math.PI / 2;
    ewRoad.position.y = 0.01;
    scene.add(ewRoad);

    const ewLine = new THREE.Mesh(new THREE.PlaneGeometry(100, 0.1), new THREE.MeshStandardMaterial({ color: 0xffb000, roughness: 1.0 }));
    ewLine.rotation.x = -Math.PI / 2;
    ewLine.position.y = 0.015;
    scene.add(ewLine);

    // Diagonal route representing R.K. Mutt Rd
    const diagRoad = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 130), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }));
    diagRoad.rotation.x = -Math.PI / 2;
    diagRoad.rotation.z = -Math.PI / 4;
    diagRoad.position.y = 0.012;
    scene.add(diagRoad);

    // Build vehicles
    const vehiclesGroup = new THREE.Group();
    scene.add(vehiclesGroup);

    const localVehicles = [];
    const carColors = [0x00E5FF, 0x3B82F6, 0x6D5DFB, 0x4b5563, 0xf1f5f9];

    for (let i = 0; i < 70; i++) {
      const type = Math.random() < 0.15 ? 'bus' : (Math.random() < 0.35 ? 'auto' : 'car');
      const road = Math.floor(Math.random() * 3);
      const direction = Math.random() < 0.5 ? 1 : -1;
      const progress = Math.random() * 100 - 50;
      const speed = (type === 'bus' ? 0.06 : (type === 'auto' ? 0.09 : 0.13)) * direction;
      const offset = (Math.random() * 0.45 + 0.45) * (direction === 1 ? 1 : -1);

      let vMesh;
      if (type === 'bus') {
        vMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 1.4), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 }));
      } else if (type === 'auto') {
        vMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.6), new THREE.MeshStandardMaterial({ color: 0xffb000, roughness: 0.4 }));
      } else {
        vMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.9), new THREE.MeshStandardMaterial({ color: carColors[i % carColors.length], roughness: 0.3 }));
      }
      
      vMesh.position.set(0, -10, 0);
      vehiclesGroup.add(vMesh);

      localVehicles.push({ mesh: vMesh, type, road, progress, speed, offset });
    }
    vehiclesRef.current = localVehicles;

    // 6. Holographic Parking Cylinders
    const wireMatA = new THREE.MeshBasicMaterial({ color: getParkCol(parkingOccupancies.A), wireframe: true, transparent: true, opacity: 0.18 });
    const parkA = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.6, 16, 1, true), wireMatA);
    parkA.position.set(-11, 0.8, 5);
    scene.add(parkA);
    parkingZoneARef.current = parkA;

    const wireMatB = new THREE.MeshBasicMaterial({ color: getParkCol(parkingOccupancies.B), wireframe: true, transparent: true, opacity: 0.18 });
    const parkB = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 1.6, 16, 1, true), wireMatB);
    parkB.position.set(15, 0.8, -8);
    scene.add(parkB);
    parkingZoneBRef.current = parkB;

    const wireMatC = new THREE.MeshBasicMaterial({ color: getParkCol(parkingOccupancies.C), wireframe: true, transparent: true, opacity: 0.18 });
    const parkC = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 1.6, 16, 1, true), wireMatC);
    parkC.position.set(3, 0.8, 22);
    scene.add(parkC);
    parkingZoneCRef.current = parkC;

    // 7. Street lights poles & bulbs
    const streetlightGroup = new THREE.Group();
    scene.add(streetlightGroup);

    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 4.0);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155 });

    const bulbGeo = new THREE.SphereGeometry(0.12, 8, 8);

    const polesCoords = [
      [3, 8], [-3, -15], [8, 3], [-15, -3],
      [12, 12], [-12, -12], [22, -4], [-22, 4]
    ];

    polesCoords.forEach((p, idx) => {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(p[0], 2.0, p[1]);
      streetlightGroup.add(pole);

      const bulb = new THREE.Mesh(
        bulbGeo,
        new THREE.MeshBasicMaterial({ color: isNight ? 0xfffaed : 0xcccccc })
      );
      bulb.position.set(p[0], 4.0, p[1]);
      streetlightGroup.add(bulb);
      streetLightBulbs.current.push(bulb);

      const pointLight = new THREE.PointLight(0xffb000, isNight ? 3.5 : 0, 12);
      pointLight.position.set(p[0], 4.0, p[1]);
      streetlightGroup.add(pointLight);
      streetLightPointLights.current.push(pointLight);
    });

    // 8. Visual Shops along margins
    const shopGroup = new THREE.Group();
    scene.add(shopGroup);

    const shopsList = [
      { pos: [-14, 0, 16], size: [2.5, 1.5, 2.0], color: 0x475569 },
      { pos: [-10, 0, 16], size: [2.0, 1.5, 2.2], color: 0x334155 },
      { pos: [15, 0, 12], size: [3.0, 1.6, 2.5], color: 0x1e293b },
      { pos: [20, 0, 8], size: [2.5, 1.5, 2.0], color: 0x475569 }
    ];

    shopsList.forEach((s, sIdx) => {
      const shop = new THREE.Mesh(
        new THREE.BoxGeometry(...s.size),
        new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.9 })
      );
      shop.position.set(s.pos[0], s.size[1] / 2, s.pos[2]);
      
      const windowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(s.size[0] * 0.7, s.size[1] * 0.5),
        new THREE.MeshStandardMaterial({ color: 0x475569, emissive: 0xfffaed, emissiveIntensity: isNight ? 0.45 : 0 })
      );
      windowMesh.position.set(0, -0.1, s.size[2] / 2 + 0.01);
      shop.add(windowMesh);
      shopLights.current.push(windowMesh);

      shopGroup.add(shop);
    });

    // 9. Weather Particle Systems
    // Fireflies
    const fireflyGeo = new THREE.BufferGeometry();
    const ffCount = 90;
    const ffPositions = new Float32Array(ffCount * 3);
    const ffSpeeds = new Float32Array(ffCount);
    for (let i = 0; i < ffCount; i++) {
      ffPositions[i * 3] = Math.random() * 80 - 40;
      ffPositions[i * 3 + 1] = Math.random() * 9 + 0.5;
      ffPositions[i * 3 + 2] = Math.random() * 80 - 40;
      ffSpeeds[i] = Math.random() * 0.03 + 0.005;
    }
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(ffPositions, 3));
    const ffMat = new THREE.PointsMaterial({ color: 0x22C55E, size: 0.15, transparent: true, opacity: 0.75 });
    const fireflies = new THREE.Points(fireflyGeo, ffMat);
    scene.add(fireflies);
    firefliesRef.current = fireflies;

    // Rain static particles
    const rainGeo = new THREE.BufferGeometry();
    const rCount = 1000;
    const rPositions = new Float32Array(rCount * 3);
    for (let i = 0; i < rCount; i++) {
      rPositions[i * 3] = Math.random() * 100 - 50;
      rPositions[i * 3 + 1] = Math.random() * 40 + 10;
      rPositions[i * 3 + 2] = Math.random() * 100 - 50;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rPositions, 3));
    const rMat = new THREE.PointsMaterial({ color: 0xa5f3fc, size: 0.06, transparent: true, opacity: 0.65 });
    const rain = new THREE.Points(rainGeo, rMat);
    scene.add(rain);
    rainRef.current = rain;

    // Fluffy cloud boxes
    const cloudGroup = new THREE.Group();
    cloudGroup.position.y = 20;
    scene.add(cloudGroup);
    cloudsRef.current = cloudGroup;

    const cloudCoords = [
      { pos: [-12, 0, -18], size: [8, 1.5, 6] },
      { pos: [14, 1.5, 12], size: [10, 1.8, 8] },
      { pos: [-24, -1, 20], size: [6, 1.2, 5] },
      { pos: [8, -2, -26], size: [9, 1.6, 7] }
    ];
    cloudCoords.forEach(c => {
      const cloudMesh = new THREE.Mesh(
        new THREE.BoxGeometry(...c.size),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.38 })
      );
      cloudMesh.position.set(...c.pos);
      cloudGroup.add(cloudMesh);
    });

    // Pedestrians
    const pedGroup = new THREE.Group();
    scene.add(pedGroup);

    const localPeds = [];
    const colorsList = [0x60a5fa, 0xf87171, 0x34d399, 0xfbbf24, 0xe2e8f0];
    for (let pIdx = 0; pIdx < 45; pIdx++) {
      const isTemple = Math.random() < 0.6;
      const x = isTemple ? -15 + (Math.random() * 8 - 4) : (Math.random() * 10 - 5);
      const z = isTemple ? 5 + (Math.random() * 6 - 3) : (Math.random() * 10 - 5);
      const speed = 0.012 + Math.random() * 0.015;
      const direction = Math.random() < 0.5 ? 1 : -1;
      const walkAxis = Math.random() < 0.5 ? 'x' : 'z';

      const pedMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.32, 6),
        new THREE.MeshStandardMaterial({ color: colorsList[pIdx % colorsList.length] })
      );
      pedMesh.position.set(x, 0.18, z);
      pedGroup.add(pedMesh);
      localPeds.push({ mesh: pedMesh, x, z, speed, direction, walkAxis, progress: 0 });
    }
    pedestriansRef.current = localPeds;

    // 10. Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 12;
    controls.maxDistance = 80;
    controlsRef.current = controls;

    // 11. Animation loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      const elapsed = clockRef.current.getElapsedTime();

      // Clouds rotation
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y = elapsed * 0.003;
      }

      // Fireflies floating movement
      if (firefliesRef.current) {
        const positions = firefliesRef.current.geometry.attributes.position.array;
        for (let i = 0; i < ffCount; i++) {
          positions[i * 3 + 1] += Math.sin(elapsed * 1.5 + i) * ffSpeeds[i] * 0.04;
          positions[i * 3] += Math.cos(elapsed * 0.4 + i) * 0.003;
          if (positions[i * 3 + 1] < 0.2) positions[i * 3 + 1] = 0.6;
        }
        firefliesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Rain animation
      const w = weather.toLowerCase();
      const showRain = w === 'rainy' || w === 'stormy';
      if (rainRef.current) {
        rainRef.current.visible = showRain;
        if (showRain) {
          const positions = rainRef.current.geometry.attributes.position.array;
          const fallSpeed = w === 'stormy' ? 0.95 : 0.55;
          const wind = w === 'stormy' ? -0.15 : -0.04;
          for (let i = 0; i < rCount; i++) {
            positions[i * 3 + 1] -= fallSpeed;
            positions[i * 3] += wind;
            if (positions[i * 3 + 1] < 0) {
              positions[i * 3 + 1] = Math.random() * 25 + 20;
              positions[i * 3] = Math.random() * 100 - 50;
            }
          }
          rainRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }

      // Pedestrians walk cycles
      pedestriansRef.current.forEach(p => {
        p.progress += p.speed * p.direction;
        if (Math.abs(p.progress) > 6) {
          p.direction *= -1; // bounce walk axis back
        }
        if (p.walkAxis === 'x') {
          p.mesh.position.x = p.x + p.progress;
        } else {
          p.mesh.position.z = p.z + p.progress;
        }
      });

      // Animated traffic flows
      const activeCount = congestionLevel === 'Heavy' ? 65 : (congestionLevel === 'Moderate' ? 38 : 16);
      const speedFactor = congestionLevel === 'Heavy' ? 0.22 : (congestionLevel === 'Moderate' ? 0.65 : 1.25);

      vehiclesRef.current.forEach((v, idx) => {
        if (idx >= activeCount) {
          v.mesh.position.y = -10;
          return;
        }

        v.progress += v.speed * speedFactor;
        if (v.progress > 50) v.progress = -50;
        if (v.progress < -50) v.progress = 50;

        if (v.road === 0) {
          v.mesh.position.set(v.offset, 0.16, v.progress);
          v.mesh.rotation.set(0, 0, 0);
        } else if (v.road === 1) {
          v.mesh.position.set(v.progress, 0.16, v.offset);
          v.mesh.rotation.set(0, Math.PI / 2, 0);
        } else {
          v.mesh.position.set(v.progress, 0.16, v.progress + v.offset);
          v.mesh.rotation.set(0, -Math.PI / 4, 0);
        }
      });

      // Drone auto camera control path
      if (cameraMode === 'drone' && cameraRef.current) {
        const radius = 42;
        const speed = elapsed * 0.02;
        cameraRef.current.position.x = Math.sin(speed) * radius;
        cameraRef.current.position.z = Math.cos(speed) * radius;
        cameraRef.current.position.y = 16 + Math.sin(elapsed * 0.04) * 4;
        cameraRef.current.lookAt(-4, 1.2, 0);
      } else if (cameraMode === 'temple' && cameraRef.current) {
        cameraRef.current.position.set(-18, 9, 14);
        cameraRef.current.lookAt(-18, 3.5, -6);
      } else if (cameraMode === 'traffic' && cameraRef.current) {
        cameraRef.current.position.set(0, 10, 14);
        cameraRef.current.lookAt(0, 0.15, 0);
      } else if (cameraMode === 'parking' && cameraRef.current) {
        cameraRef.current.position.set(6, 9, 28);
        cameraRef.current.lookAt(3, 0.8, 22);
      } else if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        try {
          containerRef.current.removeChild(rendererRef.current.domElement);
        } catch (e) {}
      }
      renderer.dispose();
    };
  }, [congestionLevel, weather, cameraMode]);

  // Handle active states live updates in background context
  useEffect(() => {
    if (!sceneRef.current) return;

    // Day/Night colors updates
    const bgCol = isNight ? 0x020617 : 0x050b18;
    sceneRef.current.background = new THREE.Color(bgCol);
    sceneRef.current.fog.color = new THREE.Color(bgCol);

    if (ambientLightRef.current) {
      ambientLightRef.current.color = new THREE.Color(isNight ? 0x1e1b4b : 0xffffff);
      ambientLightRef.current.intensity = isNight ? 0.08 : 0.45;
    }

    if (dirLightRef.current) {
      const normalSunInt = isNight ? 0.08 : 1.25;
      dirLightRef.current.intensity = normalSunInt;
      dirLightRef.current.color = new THREE.Color(isNight ? 0x6366f1 : (hour > 16 || hour < 8 ? 0xf97316 : 0xfef08a));
    }

    // Street light toggling
    streetLightPointLights.current.forEach(l => {
      l.intensity = isNight ? 3.5 : 0;
    });
    streetLightBulbs.current.forEach(b => {
      b.material.color.setHex(isNight ? 0xfffaed : 0xcccccc);
    });

    // Windows glow toggling
    shopLights.current.forEach(w => {
      w.material.emissiveIntensity = isNight ? 0.45 : 0;
    });

    // Update parking zones color
    if (parkingZoneARef.current) parkingZoneARef.current.material.color.setHex(getParkCol(parkingOccupancies.A));
    if (parkingZoneBRef.current) parkingZoneBRef.current.material.color.setHex(getParkCol(parkingOccupancies.B));
    if (parkingZoneCRef.current) parkingZoneCRef.current.material.color.setHex(getParkCol(parkingOccupancies.C));

  }, [hour, parkingOccupancies]);

  return <div ref={containerRef} className="w-full h-full" />;
};

// ==========================================================
// 4. CHARTS COMPONENT (METRICS AND CONF MATRIX)
// ==========================================================
const AccuracyCharts = ({ metrics }) => {
  const models = Object.keys(metrics.comparison);
  const selectedModel = metrics.best_model_name;

  return (
    <div className="glass-panel p-4 flex flex-col gap-4 select-none" id="charts-panel-container">
      <h3 className="text-xs font-black tracking-wider text-white border-b border-white/5 pb-2">
        Machine Learning Grid Benchmarks
      </h3>
      
      {/* Accuracy bars */}
      <div className="flex flex-col gap-2.5">
        {models.map(m => {
          const acc = metrics.comparison[m].accuracy;
          const isBest = m === selectedModel;
          return (
            <div key={m} className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[10px]">
                <span className={isBest ? 'text-electric-cyan font-bold' : 'text-gray-400'}>
                  {m} {isBest && '🏆'}
                </span>
                <span className="text-white font-mono">{acc}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${acc}%`,
                    background: isBest ? 'linear-gradient(135deg, #00E5FF, #3B82F6)' : 'rgba(255,255,255,0.15)',
                    backgroundColor: isBest ? '#00E5FF' : '#475569'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Confusion Matrix */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Confusion Matrix</h4>
          <span className="text-[8px] text-electric-cyan bg-electric-cyan/10 px-1.5 py-0.5 rounded font-bold font-mono">F1 MATCH</span>
        </div>
        
        <div className="grid grid-cols-4 gap-0.5 text-center font-mono text-[10px]">
          {/* Header Row */}
          <div className="text-[8px] text-gray-500 self-center">Act \ Pred</div>
          <div className="bg-white/5 p-0.5 text-gray-400 rounded">Low</div>
          <div className="bg-white/5 p-0.5 text-gray-400 rounded">Mod</div>
          <div className="bg-white/5 p-0.5 text-gray-400 rounded">Heavy</div>

          {/* Row 1 */}
          <div className="bg-white/5 p-0.5 text-gray-400 rounded self-center text-[8px]">Low</div>
          <div className="bg-emerald-500/20 text-emerald-400 font-bold p-1.5 rounded border border-emerald-500/20">{metrics.confusion_matrix[0][0]}</div>
          <div className="bg-white/5 text-gray-500 p-1.5 rounded">{metrics.confusion_matrix[0][1]}</div>
          <div className="bg-white/5 text-gray-500 p-1.5 rounded">{metrics.confusion_matrix[0][2]}</div>

          {/* Row 2 */}
          <div className="bg-white/5 p-0.5 text-gray-400 rounded self-center text-[8px]">Mod</div>
          <div className="bg-white/5 text-gray-500 p-1.5 rounded">{metrics.confusion_matrix[1][0]}</div>
          <div className="bg-amber-500/20 text-amber-400 font-bold p-1.5 rounded border border-amber-500/20">{metrics.confusion_matrix[1][1]}</div>
          <div className="bg-white/5 text-gray-500 p-1.5 rounded">{metrics.confusion_matrix[1][2]}</div>

          {/* Row 3 */}
          <div className="bg-white/5 p-0.5 text-gray-400 rounded self-center text-[8px]">Heavy</div>
          <div className="bg-white/5 text-gray-500 p-1.5 rounded">{metrics.confusion_matrix[2][0]}</div>
          <div className="bg-white/5 text-gray-500 p-1.5 rounded">{metrics.confusion_matrix[2][1]}</div>
          <div className="bg-red-500/20 text-red-400 font-bold p-1.5 rounded border border-red-500/20">{metrics.confusion_matrix[2][2]}</div>
        </div>
      </div>
    </div>
  );
};

// Left Panel layout (Time & Weather indicator)
const LeftPanel = ({ hour, dayOfWeek, weather, stats, congestionLevel, congestionColor }) => {
  const getDayName = (d) => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][d];
  const [bellsVolState, setBellsVolState] = useState(50);
  const [birdsVolState, setBirdsVolState] = useState(40);
  const [trafficVolState, setTrafficVolState] = useState(50);
  const [rainVolState, setRainVolState] = useState(0);

  const handleVolChange = (type, val) => {
    const norm = val / 100;
    if (type === 'bells') {
      setBellsVolState(val);
      setBellsVolume(norm);
    } else if (type === 'birds') {
      setBirdsVolState(val);
      setBirdsVolume(norm);
    } else if (type === 'traffic') {
      setTrafficVolState(val);
      setTrafficVolume(norm);
    } else if (type === 'rain') {
      setRainVolState(val);
      setRainVolume(norm);
    }
    playUIHover();
  };

  return (
    <div className="glass-panel p-4.5 flex flex-col gap-4.5 select-none animate-float-slow" id="left-panel-container">
      {/* Title */}
      <div>
        <h2 className="text-sm font-black text-white tracking-wide leading-none">Vanakkam! 🙏</h2>
        <p className="text-[10px] text-gray-400 mt-1 leading-normal">Welcome to Mylapore Smart Mobility Assistant</p>
      </div>

      {/* Weather Info */}
      <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {weather === 'sunny' ? '☀️' : (weather === 'cloudy' ? '☁️' : (weather === 'rainy' ? '🌧️' : '⛈️'))}
          </span>
          <div>
            <h4 className="text-xs font-bold text-white">{stats.temperature_celsius}°C</h4>
            <p className="text-[8px] text-gray-400 capitalize">{weather}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-gray-400 uppercase tracking-widest">{getDayName(dayOfWeek)}</p>
          <p className="text-[10px] font-bold font-mono text-electric-cyan">{hour.toString().padStart(2, '0')}:00</p>
        </div>
      </div>

      {/* Immersive Sound Mixer */}
      <div className="flex flex-col gap-2">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-1">
          Ambient Audio Mix Deck
        </h4>
        <div className="flex flex-col gap-2.5">
          {/* Temple bells */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 cursor-pointer hover:text-white" onClick={() => { playTempleBell(); }}>
                🔔 Temple Bell Chime (Trigger)
              </span>
              <span className="font-mono text-white text-[8px]">{bellsVolState}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={bellsVolState} 
              onChange={(e) => handleVolChange('bells', parseInt(e.target.value))}
              className="w-full h-0.5 bg-white/10 rounded accent-orange-400 cursor-pointer"
            />
          </div>

          {/* Birds */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Birds Ambience</span>
              <span className="font-mono text-white text-[8px]">{birdsVolState}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={birdsVolState} 
              onChange={(e) => handleVolChange('birds', parseInt(e.target.value))}
              className="w-full h-0.5 bg-white/10 rounded accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Traffic */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Traffic Hum</span>
              <span className="font-mono text-white text-[8px]">{trafficVolState}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={trafficVolState} 
              onChange={(e) => handleVolChange('traffic', parseInt(e.target.value))}
              className="w-full h-0.5 bg-white/10 rounded accent-electric-cyan cursor-pointer"
            />
          </div>

          {/* Rain */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Rain Static</span>
              <span className="font-mono text-white text-[8px]">{rainVolState}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={rainVolState} 
              onChange={(e) => handleVolChange('rain', parseInt(e.target.value))}
              className="w-full h-0.5 bg-white/10 rounded accent-sky-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Traffic Alert */}
      <div 
        className="p-2.5 rounded-xl flex items-center justify-between border transition-all duration-300"
        style={{
          background: `rgba(${congestionLevel === 'Heavy' ? '239, 68, 68' : (congestionLevel === 'Moderate' ? '255, 176, 0' : '34, 197, 94')}, 0.08)`,
          borderColor: `rgba(${congestionLevel === 'Heavy' ? '239, 68, 68' : (congestionLevel === 'Moderate' ? '255, 176, 0' : '34, 197, 94')}, 0.22)`
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-electric-cyan animate-spin" style={{ animationDuration: '8s' }}>🧭</span>
          <div>
            <p className="text-[7px] text-gray-400 uppercase">Traffic Status</p>
            <h5 className="text-[10px] font-black uppercase tracking-wide" style={{ color: congestionColor }}>
              {congestionLevel} Traffic
            </h5>
          </div>
        </div>
        <span 
          className="w-2 h-2 rounded-full" 
          style={{ 
            backgroundColor: congestionColor,
            boxShadow: `0 0 6px ${congestionColor}` 
          }}
        />
      </div>
    </div>
  );
};

// Right Panel layout (Prediction data)
const RightPanel = ({ results, parkingOccupancies, isNight }) => {
  return (
    <div className="glass-panel p-4.5 flex flex-col gap-4.5 select-none animate-float-medium" id="right-panel-container">
      <h3 className="text-xs font-black tracking-wider text-white border-b border-white/5 pb-2">
        AI Predictive Analytics
      </h3>

      {results ? (
        <div className="flex flex-col gap-4">
          {/* Commute Duration and speed */}
          <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-[7px] text-gray-400 uppercase tracking-widest">EST. COMMUTE</p>
              <h4 className="text-lg font-black text-white leading-tight">{results.traffic.travel_time_minutes} Mins</h4>
            </div>
            <div className="text-right">
              <p className="text-[7px] text-gray-400 uppercase tracking-widest">AVG SPEED</p>
              <h5 className="text-xs font-bold text-electric-cyan leading-tight">{results.traffic.average_speed_kmh} km/h</h5>
            </div>
          </div>

          {/* Parking occupancies forecasts */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Parking Occupancies</h4>
            
            {results.parking.map(p => {
              const pct = p.occupancy_rate_percent;
              const isFull = pct > 85;
              const isMed = pct > 60;
              const statusColor = isFull ? '#ef4444' : (isMed ? '#ffb000' : '#22c55e');
              return (
                <div key={p.zone_id} className="bg-white/5 border border-white/5 p-2.5 rounded-lg flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <div>
                      <span className="font-bold text-white">Zone {p.zone_id}</span>
                      <span className="text-[8px] text-gray-400 ml-1.5">• {p.walk_minutes}m walk</span>
                    </div>
                    <span className="font-mono font-bold" style={{ color: statusColor }}>{pct}%</span>
                  </div>
                  {/* Gauge bar */}
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: statusColor }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommended Route layout */}
          <div className="flex flex-col gap-1.5 border-t border-white/5 pt-2.5">
            <p className="text-[7px] text-gray-400 uppercase tracking-widest">RECOMMENDED TRANSIT</p>
            <p className="text-white font-bold leading-normal">
              Via {results.routes[0].name.replace(" Route", "")}
            </p>
            <p className="text-gray-400">
              Commute Score: <strong>{Math.round(results.routes[0].score)} pts</strong> • Dist: <strong>2.3 km</strong>
            </p>
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
          <span className="text-xl animate-pulse">⚠️</span>
          <p className="text-[10px] text-gray-400 max-w-[180px] leading-relaxed">
            Configure trip scenario planner below and run predictive models.
          </p>
        </div>
      )}
    </div>
  );
};

// Center Scenario Planner form panel
const CenterPanel = ({
  source, setSource,
  destination, setDestination,
  hour, setHour,
  dayOfWeek, setDayOfWeek,
  weather, setWeather,
  festival, setFestival,
  holiday, setHoliday,
  predict,
  isLoading
}) => {
  const getDayLabel = (d) => ["M", "T", "W", "T", "F", "S", "S"][d];

  return (
    <div className="glass-panel p-4.5 flex flex-col gap-4 select-none animate-float-slow" id="center-panel-container">
      <h3 className="text-xs font-black tracking-wider text-white border-b border-white/5 pb-2">
        Mobility Scenario Planner
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Source selection */}
        <div className="flex flex-col gap-1">
          <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Starting Source</label>
          <select 
            value={source} 
            onChange={(e) => setSource(e.target.value)}
            className="bg-white/5 border border-white/5 rounded-lg p-2 outline-none text-xs text-white focus:border-electric-cyan"
          >
            <option value="Luz Corner">Luz Corner</option>
            <option value="Kapaleeshwarar Temple">Kapaleeshwarar Temple</option>
            <option value="Mandaveli">Mandaveli Junction</option>
            <option value="Greenways Rd">Greenways Road Station</option>
          </select>
        </div>

        {/* Destination selection */}
        <div className="flex flex-col gap-1">
          <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Destination</label>
          <select 
            value={destination} 
            onChange={(e) => setDestination(e.target.value)}
            className="bg-white/5 border border-white/5 rounded-lg p-2 outline-none text-xs text-white focus:border-electric-cyan"
          >
            <option value="Luz Corner">Luz Corner</option>
            <option value="Kapaleeshwarar Temple">Kapaleeshwarar Temple</option>
            <option value="Mandaveli">Mandaveli Junction</option>
            <option value="Greenways Rd">Greenways Road Station</option>
          </select>
        </div>

        {/* Departure Hour slider */}
        <div className="col-span-2 flex flex-col gap-1">
          <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Departure Time</span>
            <span className="text-electric-cyan font-bold font-mono">{hour.toString().padStart(2, '0')}:00</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="23" 
            value={hour} 
            onChange={(e) => setHour(parseInt(e.target.value))}
            className="w-full accent-electric-cyan mt-1 h-1 bg-white/10 rounded cursor-pointer"
          />
        </div>

        {/* Day buttons */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Departure Day</label>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map(d => (
              <button 
                key={d}
                type="button"
                onClick={() => setDayOfWeek(d)}
                className={`flex-grow py-1.5 rounded-md font-bold text-[10px] transition ${dayOfWeek === d ? 'bg-electric-cyan text-dark-obsidian' : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                {getDayLabel(d)}
              </button>
            ))}
          </div>
        </div>

        {/* Weather buttons */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Expected Weather</label>
          <div className="grid grid-cols-4 gap-1">
            {["sunny", "cloudy", "rainy", "stormy"].map(w => (
              <button 
                key={w}
                type="button"
                onClick={() => setWeather(w)}
                className={`py-1.5 rounded-md text-[10px] capitalize transition ${weather === w ? 'bg-electric-cyan text-dark-obsidian' : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Festival & Holiday Checkboxes */}
        <div className="col-span-2 flex gap-4 mt-1">
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-gray-300">
            <input 
              type="checkbox" 
              checked={festival} 
              onChange={(e) => setFestival(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-white/10 accent-electric-cyan"
            />
            <span>Panguni Festival Active</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-gray-300">
            <input 
              type="checkbox" 
              checked={holiday} 
              onChange={(e) => setHoliday(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-white/10 accent-electric-cyan"
            />
            <span>Public Holiday</span>
          </label>
        </div>
      </div>

      {/* Predict Button */}
      <button 
        onClick={predict}
        disabled={isLoading}
        className="w-full mt-2 py-3 bg-gradient-to-r from-electric-cyan to-royal-blue text-dark-obsidian font-black rounded-lg tracking-wider text-xs transition duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 uppercase shadow-neon-cyan"
      >
        {isLoading ? (
          <>
            <span className="w-3.5 h-3.5 border border-dark-obsidian border-t-transparent rounded-full animate-spin" />
            Analyzing Grid...
          </>
        ) : (
          'Predict Scenario Now'
        )}
      </button>
    </div>
  );
};

// ==========================================================
// 5. MAIN INTEGRATED REACT APP
// ==========================================================
const App = () => {
  const [source, setSource] = useState("Luz Corner");
  const [destination, setDestination] = useState("Kapaleeshwarar Temple");
  const [hour, setHour] = useState(8);
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [weather, setWeather] = useState("sunny");
  const [festival, setFestival] = useState(false);
  const [holiday, setHoliday] = useState(false);
  
  // HUD variables
  const [cameraMode, setCameraMode] = useState('drone'); // drone | temple | traffic | free
  const [activeLayer, setActiveLayer] = useState('map'); // map | camera | parking | festival | transit | weather | emergency
  const [sfxOn, setSfxOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [lang, setLang] = useState("en");

  const isNight = hour < 6 || hour > 18;

  // Payloads
  const [predictionResults, setPredictionResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState("12:00:00 AM");

  // Local clock timer for HUD welcome card
  useEffect(() => {
    const timer = setInterval(() => {
      const date = new Date();
      setCurrentTimeStr(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const parkingOccupancies = useMemo(() => {
    if (!predictionResults || !predictionResults.parking) return { A: 23, B: 33, C: 26 };
    return {
      A: predictionResults.parking[0].occupancy_rate_percent,
      B: predictionResults.parking[1].occupancy_rate_percent,
      C: predictionResults.parking[2].occupancy_rate_percent
    };
  }, [predictionResults]);

  const fetchPredictions = async (triggerVoice = false) => {
    setIsLoading(true);
    playUIClick();
    
    const formattedHour = hour.toString().padStart(2, '0');
    const timeStr = `${formattedHour}:00`;
    
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          destination,
          time: timeStr,
          day_of_week: dayOfWeek,
          weather,
          festival,
          holiday
        })
      });
      
      if (!response.ok) throw new Error("Inference failed");
      const data = await response.json();
      
      setPredictionResults(data);
      playSuccessChime();

      if (triggerVoice && voiceOn) {
        const text = lang === 'ta' 
          ? `கணிப்பு முடிந்தது. போக்குவரத்து நிலை: ${data.traffic.congestion_level}.`
          : `Prediction completed. Congestion index is ${data.traffic.congestion_level}. Estimated commute is ${data.traffic.travel_time_minutes} minutes.`;
        speakAlert(text, lang);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startTrafficHum();
    startRainHum();
    startAmbientBirds();
    fetchPredictions(false);
    return () => {
      stopTrafficHum();
      stopRainHum();
      stopAmbientBirds();
    };
  }, []);

  useEffect(() => {
    toggleSFX(sfxOn);
  }, [sfxOn]);

  useEffect(() => {
    setVoiceMuted(!voiceOn);
  }, [voiceOn]);

  // Adjust rain sound dynamically based on weather selection
  useEffect(() => {
    const isRainy = weather === 'rainy' || weather === 'stormy';
    const volume = isRainy ? (weather === 'stormy' ? 0.8 : 0.4) : 0.0;
    setRainVolume(volume);
  }, [weather]);

  const handleOrbClick = () => {
    playTempleBell();
    const text = lang === 'ta'
      ? "வணக்கம்! ஸ்மார்ட் மயிலாப்பூர் மொபிலிட்டி உதவிக்கு உங்களை வரவேற்கிறோம்."
      : "Vanakkam! Welcome to Mylapore Smart Mobility Assistant. I will help you predict routing paths and parking.";
    speakAlert(text, lang);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-dark-obsidian font-sans select-none">
      
      {/* Fullscreen 3D Background */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-auto">
        <MylaporeScene 
          hour={hour}
          weather={weather}
          congestionLevel={predictionResults?.traffic.congestion_level || "Low"}
          parkingOccupancies={parkingOccupancies}
          cameraMode={cameraMode}
          source={source}
          destination={destination}
        />
      </div>

      {/* Dynamic Laser Grid Scanning overlay during ML processing */}
      {isLoading && (
        <div className="absolute inset-0 z-10 pointer-events-none bg-electric-cyan/5 flex flex-col items-center justify-center animate-pulse">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-electric-cyan to-transparent absolute top-0 animate-[scan_2s_ease-in-out_infinite]" />
          <div className="w-56 h-56 border-2 border-electric-cyan/20 rounded-full animate-ping absolute" />
          <div className="w-40 h-40 border-2 border-electric-cyan/40 rounded-full animate-spin absolute" style={{ animationDuration: '4s' }} />
          <span className="text-xs uppercase tracking-widest font-black text-electric-cyan font-display drop-shadow-neon">
            AI Neural Scanning Grid...
          </span>
        </div>
      )}

      {/* Floating HUD controls layer */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 pointer-events-none">
        
        {/* Floating Top Header bar */}
        <header className="vision-dock flex items-center justify-between w-full p-3 px-6 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-electric-cyan via-royal-blue to-deep-purple rounded-lg flex items-center justify-center font-black text-dark-obsidian text-sm shadow-neon-cyan">
              MY
            </div>
            <div>
              <h1 className="text-sm font-black font-display text-white tracking-tight uppercase">Mylapore AI Smart Mobility</h1>
              <p className="text-[8px] text-electric-cyan tracking-wider uppercase font-semibold">Cinematic Digital Twin HUD</p>
            </div>
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center gap-3">
            {/* Language */}
            <button 
              onClick={() => { setLang(lang === 'en' ? 'ta' : 'en'); playUIClick(); }}
              className="px-2 py-1 bg-white/5 border border-white/5 hover:bg-white/10 rounded-md text-[9px] text-gray-300 font-bold"
            >
              {lang === 'en' ? 'EN' : 'தமிழ்'}
            </button>

            {/* Sound FX Switch */}
            <button 
              onClick={() => { setSfxOn(!sfxOn); playUIClick(); }}
              className={`px-2.5 py-1 rounded-md text-[9px] font-bold border transition ${sfxOn ? 'bg-electric-cyan/10 border-electric-cyan/30 text-electric-cyan' : 'bg-white/5 border-white/5 text-gray-400'}`}
            >
              SFX {sfxOn ? 'On' : 'Off'}
            </button>

            {/* Voice Assistant Switch */}
            <button 
              onClick={() => { setVoiceOn(!voiceOn); playUIClick(); }}
              className={`px-2.5 py-1 rounded-md text-[9px] font-bold border transition ${voiceOn ? 'bg-deep-purple/10 border-deep-purple/30 text-deep-purple' : 'bg-white/5 border-white/5 text-gray-400'}`}
            >
              Voice {voiceOn ? 'On' : 'Off'}
            </button>
          </div>
        </header>

        {/* Left Column HUD Overlay (Independent scrollable card feed) */}
        <div className="absolute left-6 top-24 bottom-24 w-80 flex flex-col gap-4 overflow-y-auto no-scrollbar pointer-events-auto">
          <LeftPanel 
            hour={hour}
            dayOfWeek={dayOfWeek}
            weather={weather}
            stats={predictionResults?.weather || { temperature_celsius: 32, humidity_percent: 55, wind_speed_kmh: 8 }}
            congestionLevel={predictionResults?.traffic.congestion_level || "Low"}
            congestionColor={predictionResults?.traffic.congestion_color || "#22C55E"}
          />
          
          {predictionResults && (
            <AccuracyCharts metrics={predictionResults.ml_accuracy_metrics} />
          )}
        </div>

        {/* Center Bottom HUD Scenario Planner Panel */}
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-[420px] flex flex-col gap-4 pointer-events-auto">
          <CenterPanel
            source={source}
            setSource={setSource}
            destination={destination}
            setDestination={setDestination}
            hour={hour}
            setHour={setHour}
            dayOfWeek={dayOfWeek}
            setDayOfWeek={setDayOfWeek}
            weather={weather}
            setWeather={setWeather}
            festival={festival}
            setFestival={setFestival}
            holiday={holiday}
            predict={() => fetchPredictions(true)}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column HUD Overlay */}
        <div className="absolute right-6 top-24 bottom-24 w-80 flex flex-col gap-4 overflow-y-auto no-scrollbar pointer-events-auto">
          <RightPanel 
            results={predictionResults} 
            parkingOccupancies={parkingOccupancies}
            isNight={isNight}
          />
        </div>

        {/* Bottom Section: Apple Vision Pro dock and Orb assistant */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          <div className="w-14" /> {/* spacer */}

          {/* Floating Vision Dock */}
          <div className="vision-dock flex items-center justify-between gap-2 p-2 px-6 border border-white/10 bg-slate-950/60 backdrop-blur-2xl rounded-full pointer-events-auto">
            {[
              { id: "map", label: "Live 3D Map", icon: "🗺️" },
              { id: "camera", label: "Traffic Camera", icon: "📹" },
              { id: "parking", label: "Parking Spots", icon: "🅿️" },
              { id: "festival", label: "Festivals & Events", icon: "🎉" },
              { id: "transit", label: "Public Transport", icon: "🚌" },
              { id: "emergency", label: "SOS Alerts", icon: "🆘" }
            ].map((item) => {
              const isActive = activeLayer === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => {
                    playUIClick();
                    setActiveLayer(item.id);
                    // Match camera configurations
                    if (item.id === 'map') setCameraMode('drone');
                    else if (item.id === 'camera') setCameraMode('traffic');
                    else if (item.id === 'parking') setCameraMode('parking');
                    else if (item.id === 'festival') {
                      setCameraMode('temple');
                      playTempleBell();
                    } else setCameraMode('free');
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-full w-12 h-12 transition ${activeLayer === item.id ? 'bg-gradient-to-tr from-electric-cyan to-royal-blue text-dark-obsidian shadow-neon-cyan scale-110' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  title={item.label}
                >
                  <span className="text-xl">{item.icon}</span>
                </button>
              );
            })}
          </div>

          {/* Pulsating Voice Assistant breathing orb */}
          <div className="pointer-events-auto">
            <button 
              onClick={handleOrbClick}
              className="w-14 h-14 bg-gradient-to-tr from-electric-cyan to-royal-blue rounded-full animate-orb flex items-center justify-center text-dark-obsidian cursor-pointer active:scale-95 transition focus:outline-none shadow-neon-cyan"
            >
              <svg className="w-6 h-6 text-dark-obsidian" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"></path>
              </svg>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

// Mount the App
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
