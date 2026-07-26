import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Holographic concentric Globe representing destinations
 */
function Globe() {
  const innerRef = useRef();
  const outerRef = useRef();

  useFrame((_, delta) => {
    if (innerRef.current) {
      innerRef.current.rotation.y += delta * 0.12;
      innerRef.current.rotation.x += delta * 0.04;
    }
    if (outerRef.current) {
      outerRef.current.rotation.y -= delta * 0.08;
      outerRef.current.rotation.z += delta * 0.03;
    }
  });

  return (
    <group>
      {/* Glowing Inner Core */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshStandardMaterial
          color="#A855F7"
          roughness={0.2}
          metalness={0.8}
          emissive="#6D4AFF"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Glassy Distorted Middle Layer */}
      <mesh>
        <icosahedronGeometry args={[1.2, 4]} />
        <MeshDistortMaterial
          color="#ffffff"
          transparent
          opacity={0.16}
          roughness={0.1}
          metalness={0.1}
          distort={0.2}
          speed={1.6}
        />
      </mesh>

      {/* Holographic Outer Grid Layer */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[1.32, 2]} />
        <meshBasicMaterial
          color="#EDE8FF"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
}

/**
 * Orbiting card representing transactions / documents
 */
function OrbitCard({ radius, speed, offset, tilt, color, scale = [1, 1, 1] }) {
  const groupRef = useRef();
  const cardMeshRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    if (groupRef.current) {
      // Orbit coordinates
      groupRef.current.position.x = Math.cos(t) * radius;
      groupRef.current.position.z = Math.sin(t) * radius;
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.5;
      
      // Face towards target/center
      groupRef.current.rotation.y = -t + Math.PI / 2;
    }
    if (cardMeshRef.current) {
      cardMeshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 2) * 0.12;
    }
  });

  return (
    <group ref={groupRef} rotation={[tilt, 0, 0]}>
      <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.6}>
        {/* Glowing glass card body */}
        <mesh ref={cardMeshRef} scale={scale}>
          <boxGeometry args={[0.55, 0.36, 0.02]} />
          <meshStandardMaterial
            color={color}
            roughness={0.15}
            metalness={0.6}
            transparent
            opacity={0.7}
            emissive={color}
            emissiveIntensity={0.15}
          />
        </mesh>
      </Float>
    </group>
  );
}

function Scene() {
  const sceneRef = useRef();
  const lightRef = useRef();

  useFrame((state) => {
    if (sceneRef.current) {
      // Smooth camera parallax following mouse coordinate
      const targetX = state.pointer.x * 0.3;
      const targetY = state.pointer.y * 0.3;
      sceneRef.current.rotation.y = THREE.MathUtils.lerp(sceneRef.current.rotation.y, targetX, 0.05);
      sceneRef.current.rotation.x = THREE.MathUtils.lerp(sceneRef.current.rotation.x, -targetY, 0.05);
    }
    if (lightRef.current) {
      // Specular highlight shift with pointer
      lightRef.current.position.x = THREE.MathUtils.lerp(lightRef.current.position.x, state.pointer.x * 6 + 3, 0.08);
      lightRef.current.position.y = THREE.MathUtils.lerp(lightRef.current.position.y, state.pointer.y * 6 + 4, 0.08);
    }
  });

  return (
    <group ref={sceneRef}>
      {/* Lights */}
      <ambientLight intensity={0.65} />
      <directionalLight ref={lightRef} position={[3, 4, 2]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-3, -4, 3]} intensity={0.6} color="#8B5CF6" />
      <pointLight position={[0, 0, 2]} intensity={0.5} color="#A855F7" />

      {/* Central Globe */}
      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.4}>
        <Globe />
      </Float>

      {/* Elegant glass travel cards */}
      <OrbitCard radius={2.0} speed={0.25} offset={0} tilt={0.2} color="#FFFFFF" scale={[1.1, 1.1, 1]} />
      <OrbitCard radius={2.4} speed={-0.2} offset={2.1} tilt={-0.3} color="#E9D5FF" />
      <OrbitCard radius={1.8} speed={0.3} offset={4.2} tilt={0.45} color="#8B5CF6" scale={[0.9, 0.9, 1]} />
    </group>
  );
}

export default function HeroScene({ className = '' }) {
  const glRef = useRef();

  useEffect(() => {
    return () => {
      if (glRef.current) {
        const extension = glRef.current.getExtension('WEBGL_lose_context');
        if (extension) {
          extension.loseContext();
        }
      }
    };
  }, []);

  return (
    <div className={className} style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          glRef.current = gl;
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
