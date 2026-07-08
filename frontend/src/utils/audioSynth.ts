// Web Audio API Synthesizer for Smart Mylapore AI
let audioCtx: AudioContext | null = null;
let trafficNode: AudioScheduledSourceNode | null = null;
let trafficGain: GainNode | null = null;

let rainNode: AudioScheduledSourceNode | null = null;
let rainGain: GainNode | null = null;

let birdsInterval: any = null;
let isMuted = false;

// Volume levels (0.0 to 1.0)
let trafficVol = 0.5;
let rainVol = 0.0;
let birdsVol = 0.4;
let bellsVol = 0.5;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const toggleMute = (mute: boolean) => {
  isMuted = mute;
  updateVolumes();
};

const updateVolumes = () => {
  if (isMuted) {
    if (trafficGain) trafficGain.gain.value = 0;
    if (rainGain) rainGain.gain.value = 0;
  } else {
    if (trafficGain) trafficGain.gain.value = trafficVol * 0.08; // scale down hum
    if (rainGain) rainGain.gain.value = rainVol * 0.12; // scale down rain noise
  }
};

// Volume setter hooks
export const setTrafficVolume = (vol: number) => {
  trafficVol = vol;
  updateVolumes();
};

export const setRainVolume = (vol: number) => {
  rainVol = vol;
  updateVolumes();
};

export const setBirdsVolume = (vol: number) => {
  birdsVol = vol;
};

export const setBellsVolume = (vol: number) => {
  bellsVol = vol;
};

// 1. Synthesize a beautiful resonant Temple Bell
export const playTempleBell = () => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Create master gain for this specific chime
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(bellsVol * 0.6, now + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5); // 4.5 seconds decay
    
    masterGain.connect(ctx.destination);
    
    // Bell resonance frequencies (fundamental + overtones)
    const frequencies = [220, 440, 554, 659, 880, 1200];
    const gains = [0.4, 0.3, 0.15, 0.1, 0.05, 0.02];
    
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      // Add slight frequency modulation for bell vibration
      osc.frequency.linearRampToValueAtTime(freq + (idx % 2 === 0 ? 1 : -1), now + 3.0);
      
      oscGain.gain.setValueAtTime(gains[idx], now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + (3.0 / (idx + 1))); // Higher overtones decay faster
      
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      
      osc.start(now);
      osc.stop(now + 4.5);
    });
  } catch (e) {
    console.warn("Could not play synthesized bell: ", e);
  }
};

// Helper: Generate Noise Buffer
function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

// 2. Continuous Traffic Ambient Hum (Low-pass Noise)
export const startTrafficHum = () => {
  if (trafficNode) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const noiseBuffer = createNoiseBuffer(ctx);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    // Lowpass filter to make it sound like a rumble
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now); // Deep rumble
    filter.Q.setValueAtTime(1.0, now);
    
    trafficGain = ctx.createGain();
    trafficGain.gain.setValueAtTime(isMuted ? 0 : trafficVol * 0.08, now);
    
    noise.connect(filter);
    filter.connect(trafficGain);
    trafficGain.connect(ctx.destination);
    
    noise.start(now);
    trafficNode = noise;
  } catch (e) {
    console.warn("Could not start traffic hum synth: ", e);
  }
};

export const stopTrafficHum = () => {
  if (trafficNode) {
    try {
      trafficNode.stop();
    } catch (e) {}
    trafficNode = null;
  }
};

// 3. Continuous Rain Ambient Noise (Band-passed Noise)
export const startRainHum = () => {
  if (rainNode) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const noiseBuffer = createNoiseBuffer(ctx);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    // Bandpass to focus on high-frequency droplets friction
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(0.7, now);
    
    rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(isMuted ? 0 : rainVol * 0.12, now);
    
    noise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(ctx.destination);
    
    noise.start(now);
    rainNode = noise;
  } catch (e) {
    console.warn("Could not start rain hum: ", e);
  }
};

export const stopRainHum = () => {
  if (rainNode) {
    try {
      rainNode.stop();
    } catch (e) {}
    rainNode = null;
  }
};

// 4. Amber Bird Chirping scheduler
export const triggerBirdChirp = () => {
  if (isMuted || birdsVol <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const count = Math.floor(Math.random() * 2) + 2; // 2 to 3 chirps in sequence
    let startTime = now;
    
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Fast sweeping frequency for a chirping bird sound
      const startFreq = 2800 + Math.random() * 600;
      const endFreq = startFreq + 1000 + Math.random() * 400;
      
      osc.frequency.setValueAtTime(startFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(startFreq - 200, startTime + 0.14);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(birdsVol * 0.04, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.15);
      
      startTime += 0.16; // delay next chirp slightly
    }
  } catch (e) {}
};

export const startBirdsScheduler = () => {
  if (birdsInterval) return;
  // Trigger a chirp randomly every 4-8 seconds
  birdsInterval = setInterval(() => {
    if (Math.random() < 0.7) {
      triggerBirdChirp();
    }
  }, 4500);
};

export const stopBirdsScheduler = () => {
  if (birdsInterval) {
    clearInterval(birdsInterval);
    birdsInterval = null;
  }
};

// 5. UI Short Click sound (Felt-like high glass tap)
export const playUIClick = () => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {}
};

// 6. UI Hover sound (Extremely soft sine beep)
export const playUIHover = () => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {}
};

// 7. Success / Completed prediction sound (Futuristic upward chime)
export const playSuccessChime = () => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const freqs = [330, 440, 554, 659]; // E4, A4, C#5, E5
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const triggerTime = now + idx * 0.06;
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, triggerTime);
      
      gain.gain.setValueAtTime(0, triggerTime);
      gain.gain.linearRampToValueAtTime(0.1, triggerTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, triggerTime + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(triggerTime);
      osc.stop(triggerTime + 0.3);
    });
  } catch (e) {}
};

// 8. Alert sound (Double warn alert)
export const playAlertBeep = () => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const beeps = [0, 0.15];
    beeps.forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + delay;
      
      osc.type = 'sawtooth';
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, start);
      
      osc.frequency.setValueAtTime(400, start);
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + 0.15);
    });
  } catch (e) {}
};
