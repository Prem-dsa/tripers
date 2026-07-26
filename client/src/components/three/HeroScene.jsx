import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';

/**
 * Central glassy "globe" — represents travel / destinations.
 */
function Globe() {
  const meshRef = useRef();
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.15;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.15, 4]} />
      <MeshDistortMaterial
        color="#ffffff"
        transparent
        opacity={0.22}
        roughness={0.15}
        metalness={0.1}
        distort={0.25}
        speed={1.4}
      />
    </mesh>
  );
}

/**
 * A single orbiting card — represents a split expense / payment.
 */
function OrbitCard({ radius, speed, offset, tilt, color }) {
  const groupRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(t) * radius;
      groupRef.current.position.z = Math.sin(t) * radius;
      groupRef.current.position.y = Math.sin(t * 1.3) * 0.4;
      groupRef.current.rotation.y = -t;
    }
  });

  return (
    <group ref={groupRef} rotation={[tilt, 0, 0]}>
      <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh>
          <boxGeometry args={[0.42, 0.28, 0.03]} />
          <meshStandardMaterial color={color} roughness={0.25} metalness={0.4} />
        </mesh>
      </Float>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 2]} intensity={1.1} />
      <directionalLight position={[-2, -3, 3]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-3, -2, -2]} intensity={0.4} color="#A855F7" />

      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.6}>
        <Globe />
      </Float>

      <OrbitCard radius={1.9} speed={0.35} offset={0} tilt={0.15} color="#ffffff" />
      <OrbitCard radius={2.3} speed={-0.28} offset={2.1} tilt={-0.25} color="#E9D5FF" />
      <OrbitCard radius={1.7} speed={0.42} offset={4.2} tilt={0.4} color="#DDD6FE" />
    </>
  );
}

/**
 * Drop-in hero visual. Transparent background, sits absolutely
 * within a positioned parent. Designed to layer on top of the
 * purple gradient auth panels.
 */
export default function HeroScene({ className = '' }) {
  return (
    <div className={className} style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.75]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
