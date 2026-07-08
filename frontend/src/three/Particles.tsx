import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticlesProps {
  weather: string; // 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'fog'
}

export const Particles: React.FC<ParticlesProps> = ({ weather }) => {
  const firefliesRef = useRef<THREE.Points>(null);
  const rainRef = useRef<THREE.Points>(null);
  const cloudsRef = useRef<THREE.Group>(null);
  const birdsRef = useRef<THREE.Group>(null);

  // 1. Generate Firefly Particles
  const firefliesCount = 100;
  const [firefliesPosition, firefliesSpeed] = useMemo(() => {
    const pos = new Float32Array(firefliesCount * 3);
    const speed = new Float32Array(firefliesCount);
    for (let i = 0; i < firefliesCount; i++) {
      pos[i * 3] = Math.random() * 60 - 30; // x
      pos[i * 3 + 1] = Math.random() * 6 + 0.5; // y
      pos[i * 3 + 2] = Math.random() * 60 - 30; // z
      speed[i] = Math.random() * 0.02 + 0.005; // vertical speed
    }
    return [pos, speed];
  }, []);

  // 2. Generate Rain Particles
  const rainCount = 1200;
  const rainPosition = useMemo(() => {
    const pos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      pos[i * 3] = Math.random() * 80 - 40;
      pos[i * 3 + 1] = Math.random() * 30 + 10;
      pos[i * 3 + 2] = Math.random() * 80 - 40;
    }
    return pos;
  }, []);

  // 3. Setup Flock of Birds (coordinates & offset)
  const birds = useMemo(() => {
    const arr = [];
    const baseOffset = Math.random() * 100;
    for (let i = 0; i < 8; i++) {
      arr.push({
        offsetX: (i % 3) * 1.5 - 1.5,
        offsetY: Math.floor(i / 3) * 0.6 + 10,
        offsetZ: (i % 2) * 1.2 - 0.6,
        flapSpeed: 10 + Math.random() * 5,
        id: i
      });
    }
    return arr;
  }, []);

  // Frame Loop Animation
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    // Animate Fireflies (soft swaying)
    if (firefliesRef.current) {
      const positions = firefliesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < firefliesCount; i++) {
        positions[i * 3 + 1] += Math.sin(elapsed * 2 + i) * firefliesSpeed[i] * 0.15;
        positions[i * 3] += Math.cos(elapsed * 0.4 + i) * 0.004;
        
        if (positions[i * 3 + 1] < 0.2) positions[i * 3 + 1] = 0.4;
        if (positions[i * 3 + 1] > 8) positions[i * 3 + 1] = 7.5;
      }
      firefliesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Animate Rain (falling speed influenced by Stormy vs Rainy)
    if (rainRef.current && (weather === 'rainy' || weather === 'stormy')) {
      const positions = rainRef.current.geometry.attributes.position.array as Float32Array;
      const speed = weather === 'stormy' ? 1.1 : 0.6;
      const windTilt = weather === 'stormy' ? -0.2 : -0.06;
      
      for (let i = 0; i < rainCount; i++) {
        positions[i * 3 + 1] -= speed; // fall
        positions[i * 3] += windTilt; // drift
        
        // Loop back to top
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = Math.random() * 20 + 20;
          positions[i * 3] = Math.random() * 80 - 40;
        }
      }
      rainRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Animate Clouds (wind speed adjustments)
    if (cloudsRef.current) {
      let windSpeedMultiplier = 0.006;
      if (weather === 'stormy') windSpeedMultiplier = 0.035;
      else if (weather === 'rainy') windSpeedMultiplier = 0.02;
      else if (weather === 'fog') windSpeedMultiplier = 0.002;
      
      cloudsRef.current.rotation.y = elapsed * windSpeedMultiplier;
    }

    // Animate Birds flock flying in the sky
    if (birdsRef.current && weather !== 'rainy' && weather !== 'stormy') {
      // Flock center position traverses a wide circle over time
      const circleAngle = elapsed * 0.08;
      const flockX = Math.sin(circleAngle) * 25 - 5;
      const flockZ = Math.cos(circleAngle) * 25 - 5;
      
      const children = birdsRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const birdGroup = children[i] as THREE.Group;
        if (!birdGroup || !birdGroup.userData) continue;
        const b = birdGroup.userData;
        
        // Position flock member relative to center
        birdGroup.position.set(flockX + b.offsetX, b.offsetY, flockZ + b.offsetZ);
        
        // Facing direction matching tangent of circle
        birdGroup.rotation.y = circleAngle + Math.PI / 2;

        // Flapping wings
        const leftWing = birdGroup.getObjectByName('left-wing');
        const rightWing = birdGroup.getObjectByName('right-wing');
        if (leftWing && rightWing) {
          const flap = Math.sin(elapsed * b.flapSpeed) * 0.6;
          leftWing.rotation.z = flap;
          rightWing.rotation.z = -flap;
        }
      }
      birdsRef.current.visible = true;
    } else if (birdsRef.current) {
      birdsRef.current.visible = false; // Hide birds during heavy rain or storm
    }
  });

  return (
    <group>
      {/* 1. Fireflies */}
      <points ref={firefliesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[firefliesPosition, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00E5FF"
          size={0.15}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      {/* 2. Temple Lamps */}
      {[-16.5, -13.5].map((xVal, idx) => (
        [3, 7, 11, 15].map((zVal, zIdx) => (
          <mesh key={`${idx}-${zIdx}`} position={[xVal, 0.25, zVal]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#FF5722" />
            <pointLight distance={1.2} intensity={1.5} color="#FF9800" />
          </mesh>
        ))
      ))}

      {/* 3. Rain Particles */}
      {(weather === 'rainy' || weather === 'stormy') && (
        <points ref={rainRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[rainPosition, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#a5f3fc"
            size={0.08}
            transparent
            opacity={0.7}
            sizeAttenuation
          />
        </points>
      )}

      {/* 4. Drifting Weather Clouds */}
      <group ref={cloudsRef} position={[0, 16, 0]}>
        {[
          { pos: [-10, 0, -15], size: [8, 1.5, 6] },
          { pos: [15, 1, 12], size: [10, 2.0, 8] },
          { pos: [-25, -1, 20], size: [6, 1.2, 5] },
          { pos: [5, -2, -25], size: [9, 1.6, 7] },
          { pos: [-5, 2, 5], size: [7, 1.4, 5] }
        ].map((cloud, index) => (
          <mesh key={index} position={cloud.pos as [number, number, number]}>
            <boxGeometry args={cloud.size as [number, number, number]} />
            <meshStandardMaterial 
              color={weather === 'sunny' ? '#ffffff' : (weather === 'cloudy' ? '#cbd5e1' : (weather === 'fog' ? '#f1f5f9' : '#475569'))} 
              roughness={0.9} 
              transparent 
              opacity={weather === 'fog' ? 0.75 : 0.4} 
            />
          </mesh>
        ))}
      </group>

      {/* 5. Flock of Birds */}
      <group ref={birdsRef}>
        {birds.map((b) => (
          <group key={b.id} userData={b}>
            {/* Bird body */}
            <mesh>
              <boxGeometry args={[0.2, 0.05, 0.4]} />
              <meshStandardMaterial color="#1e293b" roughness={0.9} />
            </mesh>
            {/* Left wing */}
            <mesh name="left-wing" position={[-0.15, 0, 0]}>
              <boxGeometry args={[0.3, 0.01, 0.2]} />
              <meshStandardMaterial color="#334155" roughness={0.9} />
            </mesh>
            {/* Right wing */}
            <mesh name="right-wing" position={[0.15, 0, 0]}>
              <boxGeometry args={[0.3, 0.01, 0.2]} />
              <meshStandardMaterial color="#334155" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
