import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Temple } from './Temple';
import { Roads } from './Roads';
import { Particles } from './Particles';

interface SceneContentProps {
  hour: number;
  weather: string;
  congestionLevel: string;
  parkingOccupancies: { A: number; B: number; C: number };
  cameraMode: 'drone' | 'temple' | 'traffic' | 'free';
}

const SceneContent: React.FC<SceneContentProps> = ({
  hour,
  weather,
  congestionLevel,
  parkingOccupancies,
  cameraMode
}) => {
  const { camera } = useThree();
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const [lightningFlash, setLightningFlash] = useState(false);

  // Day/Night transitions based on selected hour
  // Dawn: 5-7, Day: 8-16, Dusk: 17-19, Night: 20-4
  const isNight = hour < 6 || hour > 18;
  const isDusk = hour === 17 || hour === 18;
  const isDawn = hour === 5 || hour === 6;

  // Compute ambient light attributes
  let ambientColor = "#ffffff";
  let ambientIntensity = 0.5;

  if (isNight) {
    ambientColor = "#0f172a"; // Deep midnight blue
    ambientIntensity = 0.12;
  } else if (isDusk) {
    ambientColor = "#fdba74"; // Warm sunset amber
    ambientIntensity = 0.35;
  } else if (isDawn) {
    ambientColor = "#c084fc"; // Soft dawn purple
    ambientIntensity = 0.3;
  }

  // Adjust for weather conditions
  if (weather === 'cloudy') {
    ambientIntensity *= 0.7;
    ambientColor = "#94a3b8";
  } else if (weather === 'rainy') {
    ambientIntensity *= 0.5;
    ambientColor = "#64748b";
  } else if (weather === 'stormy') {
    ambientIntensity *= 0.35;
    ambientColor = "#475569";
  } else if (weather === 'fog') {
    ambientIntensity *= 0.8;
    ambientColor = "#cbd5e1";
  }

  // Sun Light intensity & color
  let sunColor = "#ffffff";
  let sunIntensity = 1.3;

  if (isNight) {
    sunColor = "#6366f1"; // moon glow
    sunIntensity = 0.08;
  } else if (isDusk) {
    sunColor = "#f97316"; // deep orange
    sunIntensity = 0.8;
  } else if (isDawn) {
    sunColor = "#a855f7"; // dawn pink-purple
    sunIntensity = 0.7;
  } else {
    // Normal day: midday yellow sun
    sunColor = hour >= 11 && hour <= 14 ? "#fffbeb" : "#fef08a";
  }

  if (weather === 'cloudy') sunIntensity *= 0.4;
  if (weather === 'rainy') sunIntensity *= 0.2;
  if (weather === 'stormy') sunIntensity *= 0.1;
  if (weather === 'fog') sunIntensity *= 0.15;

  // Lightning Flashes for Stormy weather
  useEffect(() => {
    if (weather !== 'stormy') return;
    
    const triggerFlash = () => {
      setLightningFlash(true);
      setTimeout(() => setLightningFlash(false), 80 + Math.random() * 120);
      
      // double flash occasionally
      if (Math.random() < 0.4) {
        setTimeout(() => {
          setLightningFlash(true);
          setTimeout(() => setLightningFlash(false), 50);
        }, 250);
      }
    };

    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        triggerFlash();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [weather]);

  // Cinematic Camera movements
  useFrame((state) => {
    if (cameraMode === 'free') return;

    const elapsed = state.clock.getElapsedTime();
    
    if (cameraMode === 'temple') {
      // Orbit around Temple (located at [-15, 0, -5])
      const radius = 22;
      const angle = elapsed * 0.04;
      camera.position.x = -15 + Math.sin(angle) * radius;
      camera.position.z = -5 + Math.cos(angle) * radius;
      camera.position.y = 8 + Math.sin(elapsed * 0.08) * 3;
      camera.lookAt(-15, 2.5, -5);
    } else if (cameraMode === 'traffic') {
      // Focus on traffic intersection at [0, 0, 0] from an angle
      const angle = elapsed * 0.025;
      camera.position.x = Math.sin(angle) * 20;
      camera.position.z = 25 + Math.cos(angle) * 5;
      camera.position.y = 12 + Math.cos(elapsed * 0.05) * 2;
      camera.lookAt(0, 0.5, 0);
    } else {
      // Default 'drone': Wide cinematic overview of the whole city
      const radius = 45;
      const angle = elapsed * 0.015;
      camera.position.x = Math.sin(angle) * radius;
      camera.position.z = Math.cos(angle) * radius;
      camera.position.y = 18 + Math.sin(elapsed * 0.03) * 6;
      camera.lookAt(-5, 1, 0);
    }
  });

  return (
    <>
      {/* Lights */}
      <ambientLight color={ambientColor} intensity={ambientIntensity} />
      
      {/* Primary Directional Light (Sun/Moon) */}
      <directionalLight
        ref={dirLightRef}
        position={[25, isNight ? 12 : 30, isNight ? -15 : 20]}
        intensity={lightningFlash ? 5.0 : sunIntensity}
        color={lightningFlash ? "#e0f2fe" : sunColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Lightning ambient flashes */}
      {lightningFlash && (
        <pointLight position={[0, 25, 0]} intensity={8.0} color="#e0f2fe" distance={100} />
      )}

      {/* Subtle grid to emphasize the digital twin HUD grid */}
      <gridHelper args={[100, 100, "#00E5FF", "rgba(0,229,255,0.015)"]} position={[0, 0.005, 0]} />

      {/* Programmatic City Objects */}
      <Temple isNight={isNight} />
      <Roads 
        congestionLevel={congestionLevel} 
        parkingOccupancies={parkingOccupancies} 
        isNight={isNight}
      />
      <Particles weather={weather} />
    </>
  );
};

interface MylaporeSceneProps {
  hour: number;
  weather: string;
  congestionLevel: string;
  parkingOccupancies: { A: number; B: number; C: number };
  cameraMode: 'drone' | 'temple' | 'traffic' | 'free';
}

export const MylaporeScene: React.FC<MylaporeSceneProps> = (props) => {
  const isNight = props.hour < 6 || props.hour > 18;
  
  // Custom Fog density based on Weather
  let fogColor = isNight ? "#020617" : "#050b18";
  let fogNear = 20;
  let fogFar = 95;

  if (props.weather === 'fog') {
    fogColor = isNight ? "#1e293b" : "#e2e8f0";
    fogNear = 5;
    fogFar = 42;
  } else if (props.weather === 'rainy' || props.weather === 'stormy') {
    fogColor = isNight ? "#080c14" : "#1e293b";
    fogNear = 12;
    fogFar = 65;
  } else if (props.weather === 'cloudy') {
    fogColor = isNight ? "#090d16" : "#334155";
    fogNear = 15;
    fogFar = 80;
  }

  return (
    <div className="w-full h-full relative" id="threejs-canvas-wrapper">
      <Canvas shadows gl={{ antialias: true }}>
        <color attach="background" args={[fogColor]} />
        <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
        
        <PerspectiveCamera makeDefault position={[0, 18, 40]} fov={45} />
        
        <SceneContent {...props} />
        
        {props.cameraMode === 'free' && (
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            maxPolarAngle={Math.PI / 2 - 0.05} // prevent going underground
            minDistance={8}
            maxDistance={80}
          />
        )}
      </Canvas>
    </div>
  );
};
