import React, { useRef } from 'react';
import * as THREE from 'three';

interface TempleProps {
  isNight?: boolean;
}

export const Temple: React.FC<TempleProps> = ({ isNight }) => {
  const gopuramRef = useRef<THREE.Group>(null);

  // Stacked tiers for the Gopuram tower
  const tiers = [
    { size: [4, 1.2, 5], pos: [0, 0.6, 0], color: "#5c3d24" },  // Base
    { size: [3.4, 1.0, 4.4], pos: [0, 1.7, 0], color: "#b85c38" }, // Tier 2
    { size: [2.8, 0.9, 3.8], pos: [0, 2.65, 0], color: "#e07a5f" }, // Tier 3
    { size: [2.2, 0.8, 3.2], pos: [0, 3.5, 0], color: "#f2cc8f" },  // Tier 4
    { size: [1.6, 0.7, 2.6], pos: [0, 4.25, 0], color: "#f4a261" }, // Tier 5
    { size: [1.1, 0.6, 2.0], pos: [0, 4.9, 0], color: "#e76f51" },  // Tier 6
    { size: [0.7, 0.5, 1.4], pos: [0, 5.45, 0], color: "#d90429" }  // Top
  ];

  return (
    <group position={[-15, 0, -5]}>
      {/* 1. Temple Tank (Sacred Pool) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 10]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial 
          color="#006994" 
          roughness={0.1} 
          metalness={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>
      
      {/* Tank Stone Boundary Steps */}
      <mesh position={[0, 0.1, 10]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7, 7.3, 4]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* 2. Main Gopuram Tower */}
      <group ref={gopuramRef}>
        {tiers.map((tier, idx) => (
          <mesh key={idx} position={tier.pos as [number, number, number]}>
            <boxGeometry args={tier.size as [number, number, number]} />
            <meshStandardMaterial 
              color={tier.color} 
              roughness={0.7}
              metalness={0.2}
              emissive={isNight ? tier.color : "#000000"}
              emissiveIntensity={isNight ? 0.12 : 0}
            />
          </mesh>
        ))}

        {/* Golden Kalasam (Domes on the very top) */}
        <group position={[0, 5.8, 0]}>
          <mesh>
            <cylinderGeometry args={[0.01, 0.4, 0.3, 8]} />
            <meshStandardMaterial color="#FFB000" metalness={0.9} roughness={0.1} emissive="#ffb000" emissiveIntensity={isNight ? 0.35 : 0} />
          </mesh>
          <mesh position={[-0.3, 0, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#FFB000" metalness={0.9} roughness={0.1} emissive="#ffb000" emissiveIntensity={isNight ? 0.35 : 0} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#FFB000" metalness={0.9} roughness={0.1} emissive="#ffb000" emissiveIntensity={isNight ? 0.35 : 0} />
          </mesh>
          <mesh position={[0.3, 0, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#FFB000" metalness={0.9} roughness={0.1} emissive="#ffb000" emissiveIntensity={isNight ? 0.35 : 0} />
          </mesh>
        </group>

        {/* Glowing Temple Entrance Gate */}
        <mesh position={[0, 0.4, 2.52]}>
          <boxGeometry args={[1.5, 0.8, 0.05]} />
          <meshBasicMaterial color={isNight ? "#ff7700" : "#00E5FF"} />
        </mesh>
        
        {/* Entrance Light Spot */}
        <pointLight position={[0, 0.8, 2.8]} intensity={isNight ? 4 : 2} distance={6} color={isNight ? "#ff9900" : "#00E5FF"} />
      </group>

      {/* 3. Main Sanctum building behind the Tower */}
      <mesh position={[0, 0.8, -4]}>
        <boxGeometry args={[5, 1.6, 7]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.9} />
      </mesh>
      
      {/* Sanctum gold dome */}
      <mesh position={[0, 1.9, -4]}>
        <sphereGeometry args={[1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#FFB000" metalness={0.9} roughness={0.1} emissive="#ffb000" emissiveIntensity={isNight ? 0.3 : 0} />
      </mesh>

      {/* Additional Temple lights at night */}
      {isNight && (
        <group>
          <pointLight position={[-3, 2, 10]} intensity={2} distance={5} color="#ffa726" />
          <pointLight position={[3, 2, 10]} intensity={2} distance={5} color="#ffa726" />
          <pointLight position={[0, 3, -4]} intensity={2} distance={8} color="#ffa726" />
        </group>
      )}
    </group>
  );
};
