import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RoadsProps {
  congestionLevel: string; // 'Low' | 'Moderate' | 'Heavy'
  parkingOccupancies: { A: number; B: number; C: number };
  isNight?: boolean;
  source?: string;
  destination?: string;
}

const LANDMARK_COORDS: { [key: string]: [number, number, number] } = {
  "Luz Corner": [0, 0.1, 0],
  "Kapaleeshwarar Temple": [-15, 0.1, -5],
  "Mandaveli": [0, 0.1, 20],
  "Greenways Rd": [-20, 0.1, 0]
};

// Generates route coordinates matching the grid-aligned roads
function getRoutePoints(src: string, dest: string): THREE.Vector3[] {
  const start = LANDMARK_COORDS[src];
  const end = LANDMARK_COORDS[dest];
  if (!start || !end) return [];

  const points: THREE.Vector3[] = [];
  points.push(new THREE.Vector3(start[0], start[1] + 0.05, start[2]));

  // If Temple is involved, it sits off the main axis at [-15, 0.1, -5]
  // We need to route to x = -15, then move along z axis
  if (src === "Kapaleeshwarar Temple" || dest === "Kapaleeshwarar Temple") {
    const templePos = LANDMARK_COORDS["Kapaleeshwarar Temple"];
    if (src === "Kapaleeshwarar Temple") {
      points.push(new THREE.Vector3(-15, templePos[1] + 0.05, 0)); // Route to E-W Road
      if (dest === "Mandaveli") {
        points.push(new THREE.Vector3(0, templePos[1] + 0.05, 0)); // To intersection
        points.push(new THREE.Vector3(0, templePos[1] + 0.05, 20)); // To Mandaveli
      } else if (dest === "Greenways Rd") {
        points.push(new THREE.Vector3(-20, templePos[1] + 0.05, 0)); // Direct west
      } else if (dest === "Luz Corner") {
        points.push(new THREE.Vector3(0, templePos[1] + 0.05, 0)); // To intersection
      }
    } else {
      // Destination is temple
      if (src === "Mandaveli") {
        points.push(new THREE.Vector3(0, start[1] + 0.05, 0)); // Down to intersection
      } else if (src === "Greenways Rd") {
        points.push(new THREE.Vector3(-15, start[1] + 0.05, 0)); // Move east to temple axis
      }
      points.push(new THREE.Vector3(-15, end[1] + 0.05, 0)); // Route north/south axis
      points.push(new THREE.Vector3(end[0], end[1] + 0.05, end[2])); // To temple
    }
  } else {
    // Ordinary street route (Luz Corner, Mandaveli, Greenways Rd)
    // Connecting through intersection [0, 0.1, 0]
    if (start[0] !== end[0] && start[2] !== end[2]) {
      points.push(new THREE.Vector3(0, start[1] + 0.05, 0)); // Intersection node
    }
    points.push(new THREE.Vector3(end[0], end[1] + 0.05, end[2]));
  }
  return points;
}

export const Roads: React.FC<RoadsProps> = ({
  congestionLevel,
  parkingOccupancies,
  isNight = false,
  source = "Luz Corner",
  destination = "Kapaleeshwarar Temple"
}) => {
  const vehiclesRef = useRef<THREE.Group>(null);
  const routePulseRef = useRef<THREE.Group>(null);
  const pedestriansRef = useRef<THREE.Group>(null);

  // Speed multiplier based on congestion level
  const speedMultiplier = useMemo(() => {
    if (congestionLevel === 'Heavy') return 0.12;
    if (congestionLevel === 'Moderate') return 0.45;
    return 0.95;
  }, [congestionLevel]);

  // Traffic density count
  const vehicleCount = useMemo(() => {
    if (congestionLevel === 'Heavy') return 55;
    if (congestionLevel === 'Moderate') return 30;
    return 12;
  }, [congestionLevel]);

  // Generate randomized starting parameters for vehicle particles
  const vehicles = useMemo(() => {
    const arr = [];
    // Roads:
    // Road 0: North-South (x = 0, z from -40 to 40)
    // Road 1: East-West (z = 0, x from -40 to 40)
    // Road 2: Diagonal Expressway (x=z from -40 to 40)
    for (let i = 0; i < 65; i++) {
      const typeRand = Math.random();
      const type = typeRand < 0.08 ? 'ambulance' 
                 : typeRand < 0.15 ? 'police' 
                 : typeRand < 0.28 ? 'bus' 
                 : typeRand < 0.50 ? 'auto' 
                 : typeRand < 0.82 ? 'car' 
                 : 'bike';

      const road = Math.floor(Math.random() * 3);
      const direction = Math.random() < 0.5 ? 1 : -1;
      const progress = Math.random() * 80 - 40; // pos along path
      
      let speed = 0.12;
      if (type === 'bus') speed = 0.07;
      else if (type === 'auto') speed = 0.09;
      else if (type === 'bike') speed = 0.14;
      else if (type === 'ambulance' || type === 'police') speed = 0.18; // Emergency vehicles are faster
      
      speed *= direction;
      const offset = (Math.random() * 0.35 + 0.25) * (direction === 1 ? 1 : -1); // lane shift
      
      arr.push({ type, road, progress, speed, offset, id: i });
    }
    return arr;
  }, []);

  // Pedestrians layout
  const pedestrians = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      // Pedestrians walk near Kapaleeshwarar Temple (-15, 0, 5) or Luz Corner intersection (0,0,0)
      const isTempleArea = Math.random() < 0.6;
      const x = isTempleArea ? -15 + (Math.random() * 8 - 4) : (Math.random() * 10 - 5);
      const z = isTempleArea ? 5 + (Math.random() * 6 - 3) : (Math.random() * 10 - 5);
      const speed = 0.015 + Math.random() * 0.015;
      const direction = Math.random() < 0.5 ? 1 : -1;
      const walkAxis = Math.random() < 0.5 ? 'x' : 'z';
      const color = ["#ef4444", "#3b82f6", "#10b981", "#ffb000", "#a855f7", "#ec4899"][i % 6];
      arr.push({ x, z, speed, direction, walkAxis, color, id: i });
    }
    return arr;
  }, []);

  // Frame Loop Animation
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    // 1. Move vehicles
    if (vehiclesRef.current) {
      const children = vehiclesRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const mesh = children[i] as THREE.Group;
        if (!mesh || !mesh.userData) continue;
        
        const data = mesh.userData;
        data.progress += data.speed * speedMultiplier;
        
        // Loop back
        if (data.progress > 40) data.progress = -40;
        if (data.progress < -40) data.progress = 40;
        
        // Calculate coordinates based on road
        if (data.road === 0) {
          mesh.position.set(data.offset, 0.15, data.progress);
          mesh.rotation.set(0, data.speed > 0 ? 0 : Math.PI, 0);
        } else if (data.road === 1) {
          mesh.position.set(data.progress, 0.15, data.offset);
          mesh.rotation.set(0, data.speed > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
        } else {
          // Diagonal road x = z
          mesh.position.set(data.progress, 0.15, data.progress + data.offset);
          mesh.rotation.set(0, data.speed > 0 ? -Math.PI / 4 : (Math.PI - Math.PI / 4), 0);
        }

        // Animate siren flash for emergency vehicles
        if (data.type === 'ambulance' || data.type === 'police') {
          const sirenMesh = mesh.getObjectByName('siren') as THREE.Mesh;
          if (sirenMesh) {
            const mat = sirenMesh.material as THREE.MeshBasicMaterial;
            mat.color.setHex(Math.floor(elapsed * 10) % 2 === 0 ? 0xff0000 : 0x0000ff);
          }
        }
      }
    }

    // 2. Animate GPS pulse navigation path
    if (routePulseRef.current) {
      const dots = routePulseRef.current.children;
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i] as THREE.Mesh;
        // Pulse size and position phase shift
        const pulseFactor = Math.sin(elapsed * 5 - i * 0.4) * 0.1 + 0.22;
        dot.scale.set(pulseFactor, pulseFactor, pulseFactor);
      }
    }

    // 3. Move Pedestrians
    if (pedestriansRef.current) {
      const pChildren = pedestriansRef.current.children;
      for (let i = 0; i < pChildren.length; i++) {
        const pMesh = pChildren[i] as THREE.Mesh;
        if (!pMesh || !pMesh.userData) continue;
        const pData = pMesh.userData;
        
        pData.progressVal = (pData.progressVal || 0) + pData.speed * pData.direction;
        if (Math.abs(pData.progressVal) > 4) {
          pData.direction *= -1; // change direction
        }

        if (pData.walkAxis === 'x') {
          pMesh.position.x = pData.x + pData.progressVal;
        } else {
          pMesh.position.z = pData.z + pData.progressVal;
        }
      }
    }
  });

  // Calculate route coordinates dynamically
  const routePoints = useMemo(() => {
    return getRoutePoints(source, destination);
  }, [source, destination]);

  // Generate intermediate coordinates for visual GPS navigation dots
  const gpsDots = useMemo(() => {
    if (routePoints.length < 2) return [];
    const dots: THREE.Vector3[] = [];
    
    for (let i = 0; i < routePoints.length - 1; i++) {
      const p1 = routePoints[i];
      const p2 = routePoints[i + 1];
      const dist = p1.distanceTo(p2);
      // Put a dot every 2 units
      const dotCount = Math.max(2, Math.floor(dist / 2));
      for (let j = 0; j < dotCount; j++) {
        const t = j / dotCount;
        dots.push(new THREE.Vector3().lerpVectors(p1, p2, t));
      }
    }
    return dots;
  }, [routePoints]);

  const getParkingColor = (occupancy: number) => {
    if (occupancy > 85) return "#ef4444"; // Red
    if (occupancy > 60) return "#ffb000"; // Yellow
    return "#22c55e"; // Green
  };

  const getRouteColor = () => {
    if (congestionLevel === 'Heavy') return "#ef4444";
    if (congestionLevel === 'Moderate') return "#ffb000";
    return "#00E5FF";
  };

  return (
    <group>
      {/* 1. Road Planes (Asphalt) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[2.5, 80]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[80, 2.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} position={[0, 0.012, 0]}>
        <planeGeometry args={[2.5, 110]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* Road Yellow Dashed Lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[0.08, 80]} />
        <meshStandardMaterial color="#ffb000" roughness={1} />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[80, 0.08]} />
        <meshStandardMaterial color="#ffb000" roughness={1} />
      </mesh>

      {/* 2. Visual Glowing Navigation Route */}
      {gpsDots.length > 0 && (
        <group ref={routePulseRef}>
          {gpsDots.map((dot, idx) => (
            <mesh key={idx} position={[dot.x, dot.y + 0.1, dot.z]}>
              <sphereGeometry args={[0.25, 8, 8]} />
              <meshBasicMaterial color={getRouteColor()} transparent opacity={0.85} />
            </mesh>
          ))}
        </group>
      )}

      {/* 3. Moving Vehicles Stream */}
      <group ref={vehiclesRef}>
        {vehicles.slice(0, vehicleCount).map((v) => {
          // Add custom group representation for complex vehicle bodies
          if (v.type === 'ambulance') {
            return (
              <group key={v.id} userData={v}>
                {/* Body */}
                <mesh castShadow position={[0, 0.22, 0]}>
                  <boxGeometry args={[0.45, 0.4, 0.9]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.3} />
                </mesh>
                {/* Red cross logo sides */}
                <mesh position={[0.23, 0.22, 0]} rotation={[0, Math.PI / 2, 0]}>
                  <planeGeometry args={[0.2, 0.2]} />
                  <meshBasicMaterial color="#ef4444" />
                </mesh>
                {/* Siren */}
                <mesh name="siren" position={[0, 0.45, 0]}>
                  <sphereGeometry args={[0.08, 8, 8]} />
                  <meshBasicMaterial color="#ef4444" />
                </mesh>
                {isNight && (
                  <group>
                    <pointLight position={[0, 0.5, 0]} intensity={1.5} distance={3} color="#ef4444" />
                    {/* Headlights */}
                    <mesh position={[-0.15, 0.18, 0.46]}>
                      <sphereGeometry args={[0.04]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <mesh position={[0.15, 0.18, 0.46]}>
                      <sphereGeometry args={[0.04]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <spotLight position={[0, 0.2, 0.5]} angle={0.4} penumbra={0.5} intensity={2.0} distance={10} color="#fffaed" />
                  </group>
                )}
              </group>
            );
          }

          if (v.type === 'police') {
            return (
              <group key={v.id} userData={v}>
                <mesh castShadow position={[0, 0.18, 0]}>
                  <boxGeometry args={[0.45, 0.3, 0.8]} />
                  <meshStandardMaterial color="#1e3a8a" roughness={0.2} metalness={0.6} />
                </mesh>
                {/* Siren */}
                <mesh name="siren" position={[0, 0.35, 0]}>
                  <sphereGeometry args={[0.08, 8, 8]} />
                  <meshBasicMaterial color="#3b82f6" />
                </mesh>
                {isNight && (
                  <group>
                    <pointLight position={[0, 0.4, 0]} intensity={1.5} distance={3} color="#3b82f6" />
                    <mesh position={[-0.15, 0.15, 0.41]}>
                      <sphereGeometry args={[0.04]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <mesh position={[0.15, 0.15, 0.41]}>
                      <sphereGeometry args={[0.04]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <spotLight position={[0, 0.18, 0.45]} angle={0.4} penumbra={0.5} intensity={2.0} distance={8} color="#fffaed" />
                  </group>
                )}
              </group>
            );
          }

          if (v.type === 'bus') {
            return (
              <group key={v.id} userData={v}>
                <mesh castShadow position={[0, 0.25, 0]}>
                  <boxGeometry args={[0.6, 0.5, 1.4]} />
                  <meshStandardMaterial color="#059669" roughness={0.5} metalness={0.2} />
                </mesh>
                {/* Windows (emissive at night) */}
                <mesh position={[0, 0.28, 0]}>
                  <boxGeometry args={[0.62, 0.15, 1.1]} />
                  <meshStandardMaterial color="#334155" emissive={isNight ? "#fef08a" : "#000000"} emissiveIntensity={isNight ? 0.35 : 0} />
                </mesh>
                {isNight && (
                  <group>
                    {/* Headlights */}
                    <mesh position={[-0.2, 0.15, 0.71]}>
                      <sphereGeometry args={[0.06]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <mesh position={[0.2, 0.15, 0.71]}>
                      <sphereGeometry args={[0.06]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <spotLight position={[0, 0.2, 0.75]} angle={0.5} penumbra={0.5} intensity={3.0} distance={15} color="#fffaed" />
                  </group>
                )}
              </group>
            );
          }

          if (v.type === 'auto') {
            return (
              <group key={v.id} userData={v}>
                {/* Bottom yellow part */}
                <mesh castShadow position={[0, 0.15, 0]}>
                  <boxGeometry args={[0.38, 0.2, 0.58]} />
                  <meshStandardMaterial color="#eab308" roughness={0.3} />
                </mesh>
                {/* Top black hood */}
                <mesh position={[0, 0.3, -0.05]}>
                  <boxGeometry args={[0.36, 0.16, 0.42]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.8} />
                </mesh>
                {isNight && (
                  <group>
                    <mesh position={[0, 0.15, 0.3]}>
                      <sphereGeometry args={[0.04]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <spotLight position={[0, 0.15, 0.32]} angle={0.6} penumbra={0.5} intensity={1.5} distance={6} color="#ffeaa7" />
                  </group>
                )}
              </group>
            );
          }

          // Bike: Small narrow block
          if (v.type === 'bike') {
            return (
              <group key={v.id} userData={v}>
                <mesh castShadow position={[0, 0.12, 0]}>
                  <boxGeometry args={[0.12, 0.22, 0.42]} />
                  <meshStandardMaterial color="#d946ef" roughness={0.4} />
                </mesh>
                {isNight && (
                  <group>
                    <mesh position={[0, 0.18, 0.22]}>
                      <sphereGeometry args={[0.03]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <spotLight position={[0, 0.18, 0.23]} angle={0.4} penumbra={0.5} intensity={1.0} distance={5} color="#fffaed" />
                  </group>
                )}
              </group>
            );
          }

          // Standard Car
          const colors = ["#e2e8f0", "#475569", "#3b82f6", "#0284c7"];
          const carColor = colors[v.id % colors.length];
          return (
            <group key={v.id} userData={v}>
              <mesh castShadow position={[0, 0.16, 0]}>
                <boxGeometry args={[0.45, 0.3, 0.85]} />
                <meshStandardMaterial color={carColor} roughness={0.1} metalness={0.7} />
              </mesh>
              {isNight && (
                <group>
                  {/* Headlights */}
                  <mesh position={[-0.15, 0.12, 0.43]}>
                    <sphereGeometry args={[0.04]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                  <mesh position={[0.15, 0.12, 0.43]}>
                    <sphereGeometry args={[0.04]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                  <spotLight position={[0, 0.15, 0.45]} angle={0.45} penumbra={0.5} intensity={2.2} distance={10} color="#fffaed" />
                  
                  {/* Red taillights */}
                  <mesh position={[-0.15, 0.16, -0.43]}>
                    <sphereGeometry args={[0.03]} />
                    <meshBasicMaterial color="#ef4444" />
                  </mesh>
                  <mesh position={[0.15, 0.16, -0.43]}>
                    <sphereGeometry args={[0.03]} />
                    <meshBasicMaterial color="#ef4444" />
                  </mesh>
                </group>
              )}
            </group>
          );
        })}
      </group>

      {/* 4. Parking Lot Zones Holographic Cylinders */}
      {/* Zone A */}
      <group position={[-11, 0, 5]}>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 1.6, 16, 1, true]} />
          <meshBasicMaterial 
            color={getParkingColor(parkingOccupancies.A)} 
            wireframe 
            transparent 
            opacity={isNight ? 0.3 : 0.15} 
          />
        </mesh>
        <pointLight intensity={isNight ? 3 : 1} distance={4} color={getParkingColor(parkingOccupancies.A)} />
      </group>
      
      {/* Zone B */}
      <group position={[15, 0, -8]}>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[2.0, 2.0, 1.6, 16, 1, true]} />
          <meshBasicMaterial 
            color={getParkingColor(parkingOccupancies.B)} 
            wireframe 
            transparent 
            opacity={isNight ? 0.3 : 0.15} 
          />
        </mesh>
        <pointLight intensity={isNight ? 3 : 1} distance={4} color={getParkingColor(parkingOccupancies.B)} />
      </group>

      {/* Zone C */}
      <group position={[3, 0, 22]}>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[2.5, 2.5, 1.6, 16, 1, true]} />
          <meshBasicMaterial 
            color={getParkingColor(parkingOccupancies.C)} 
            wireframe 
            transparent 
            opacity={isNight ? 0.3 : 0.15} 
          />
        </mesh>
        <pointLight intensity={isNight ? 3 : 1} distance={4} color={getParkingColor(parkingOccupancies.C)} />
      </group>

      {/* 5. Surrounding Environment (Streetlights & Custom Coconut Trees & Shops) */}
      <group>
        {/* Streetlight 1 */}
        <group position={[3, 0, -5]}>
          <mesh position={[0, 1.75, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 3.5]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0, 3.5, 0]}>
            <sphereGeometry args={[0.15]} />
            <meshBasicMaterial color={isNight ? "#fffaed" : "#cccccc"} />
          </mesh>
          {isNight && (
            <pointLight position={[0, 3.4, 0]} intensity={3.5} distance={12} color="#ffb000" />
          )}
        </group>

        {/* Streetlight 2 */}
        <group position={[-5, 0, 8]}>
          <mesh position={[0, 1.75, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 3.5]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0, 3.5, 0]}>
            <sphereGeometry args={[0.15]} />
            <meshBasicMaterial color={isNight ? "#fffaed" : "#cccccc"} />
          </mesh>
          {isNight && (
            <pointLight position={[0, 3.4, 0]} intensity={3.5} distance={12} color="#ffb000" />
          )}
        </group>

        {/* Streetlight 3 */}
        <group position={[10, 0, 12]}>
          <mesh position={[0, 1.75, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 3.5]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0, 3.5, 0]}>
            <sphereGeometry args={[0.15]} />
            <meshBasicMaterial color={isNight ? "#fffaed" : "#cccccc"} />
          </mesh>
          {isNight && (
            <pointLight position={[0, 3.4, 0]} intensity={3.5} distance={12} color="#ffb000" />
          )}
        </group>
        
        {/* Custom Coconut Trees */}
        {[-22, -12, 10, 22, -8, 16].map((xVal, index) => {
          const zVal = index % 2 === 0 ? -16 : 14;
          return (
            <group key={index} position={[xVal, 0, zVal]}>
              {/* Curved Trunk */}
              <mesh position={[0, 1.0, 0]} rotation={[0.05, 0, 0.08]}>
                <cylinderGeometry args={[0.08, 0.16, 2.0, 8]} />
                <meshStandardMaterial color="#78350f" roughness={0.9} />
              </mesh>
              <mesh position={[0.08, 2.0, 0]} rotation={[-0.05, 0, -0.05]}>
                <cylinderGeometry args={[0.06, 0.08, 1.0, 8]} />
                <meshStandardMaterial color="#78350f" roughness={0.9} />
              </mesh>
              {/* Palm Leaves */}
              <group position={[0.05, 2.5, 0]}>
                {[0, 1, 2, 3, 4, 5].map((leafIdx) => {
                  const angle = (leafIdx * Math.PI) / 3;
                  return (
                    <mesh 
                      key={leafIdx} 
                      position={[Math.sin(angle) * 0.45, 0, Math.cos(angle) * 0.45]}
                      rotation={[0.2, angle, 0.4]}
                    >
                      <boxGeometry args={[0.8, 0.02, 0.25]} />
                      <meshStandardMaterial color="#15803d" roughness={0.7} />
                    </mesh>
                  );
                })}
              </group>
            </group>
          );
        })}

        {/* Commercial Buildings/Shops along the E-W and N-S roads */}
        {[
          { pos: [-8, 0.8, -8], size: [4, 1.6, 3], label: "Mylapore Cafe", lightColor: "#fcd34d" },
          { pos: [8, 1.0, -8], size: [3.5, 2.0, 3], label: "Giri Trading", lightColor: "#f472b6" },
          { pos: [-20, 0.9, 12], size: [5, 1.8, 4], label: "Saravana Stores", lightColor: "#60a5fa" },
          { pos: [12, 0.8, 8], size: [4, 1.6, 3], label: "Luz Corner Shop", lightColor: "#34d399" }
        ].map((shop, index) => (
          <group key={index} position={shop.pos as [number, number, number]}>
            {/* Shop structure */}
            <mesh castShadow>
              <boxGeometry args={shop.size as [number, number, number]} />
              <meshStandardMaterial color="#334155" roughness={0.75} />
            </mesh>
            {/* Storefront glowing sign at night */}
            <mesh position={[0, shop.size[1] / 2 - 0.2, shop.size[2] / 2 + 0.02]}>
              <planeGeometry args={[shop.size[0] - 0.5, 0.25]} />
              <meshBasicMaterial color={isNight ? shop.lightColor : "#1e293b"} />
            </mesh>
            {/* Emissive window panes */}
            <mesh position={[0, -0.1, shop.size[2] / 2 + 0.01]}>
              <boxGeometry args={[shop.size[0] - 1.0, 0.6, 0.02]} />
              <meshStandardMaterial color="#475569" emissive={isNight ? "#fffaed" : "#000000"} emissiveIntensity={isNight ? 0.45 : 0} />
            </mesh>
            {isNight && (
              <pointLight position={[0, -0.1, shop.size[2]/2 + 0.6]} intensity={1.5} distance={4} color={shop.lightColor} />
            )}
          </group>
        ))}
      </group>

      {/* 6. Pedestrians Walking around */}
      <group ref={pedestriansRef}>
        {pedestrians.map((p) => (
          <mesh key={p.id} position={[p.x, 0.18, p.z]} userData={p}>
            <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
            <meshStandardMaterial color={p.color} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
