import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useMemo, useEffect, Component } from 'react';
import * as THREE from 'three';

class ThreeErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn('[ThreeJS Error Suppressed]:', error);
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function ParticleField({ count = 80 }) {
  const pointsRef = useRef();

  const [positions, driftSpeeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
      speeds[i] = 0.05 + Math.random() * 0.15;
    }
    return [pos, speeds];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.03;
    pointsRef.current.rotation.x += delta * 0.01;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      let y = posAttr.getY(i);
      y += delta * driftSpeeds[i] * 0.8;
      if (y > 6) y = -6;
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#8B5CF6"
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.65}
      />
    </points>
  );
}

function WireframeGeometries() {
  const mesh1 = useRef();
  const mesh2 = useRef();

  useFrame((_, delta) => {
    if (mesh1.current) {
      mesh1.current.rotation.y -= delta * 0.05;
      mesh1.current.rotation.x += delta * 0.02;
    }
    if (mesh2.current) {
      mesh2.current.rotation.y += delta * 0.04;
      mesh2.current.rotation.z -= delta * 0.03;
    }
  });

  return (
    <group>
      <mesh ref={mesh1} position={[-3, 2, -4]}>
        <dodecahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial
          color="#6D4AFF"
          wireframe
          transparent
          opacity={0.06}
        />
      </mesh>

      <mesh ref={mesh2} position={[4, -2, -3]}>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshBasicMaterial
          color="#A855F7"
          wireframe
          transparent
          opacity={0.05}
        />
      </mesh>
    </group>
  );
}

function InteractiveScene() {
  const rootGroup = useRef();

  useFrame((state) => {
    if (!rootGroup.current) return;
    const targetX = state.pointer.x * 0.4;
    const targetY = state.pointer.y * 0.4;

    rootGroup.current.rotation.y = THREE.MathUtils.lerp(rootGroup.current.rotation.y, targetX, 0.05);
    rootGroup.current.rotation.x = THREE.MathUtils.lerp(rootGroup.current.rotation.x, -targetY, 0.05);
  });

  return (
    <group ref={rootGroup}>
      <ambientLight intensity={0.8} />
      <ParticleField count={90} />
      <WireframeGeometries />
    </group>
  );
}

export function AmbientBackground() {
  const glRef = useRef();

  useEffect(() => {
    return () => {
      if (glRef.current && typeof glRef.current.getContext === 'function') {
        try {
          const webglCtx = glRef.current.getContext();
          if (webglCtx && typeof webglCtx.getExtension === 'function') {
            const extension = webglCtx.getExtension('WEBGL_lose_context');
            if (extension) extension.loseContext();
          }
        } catch {}
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-35">
      <ThreeErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 1.5]}
          onCreated={({ gl }) => {
            glRef.current = gl;
          }}
        >
          <Suspense fallback={null}>
            <InteractiveScene />
          </Suspense>
        </Canvas>
      </ThreeErrorBoundary>
    </div>
  );
}
