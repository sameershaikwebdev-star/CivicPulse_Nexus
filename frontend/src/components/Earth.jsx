import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Float } from "@react-three/drei";
import { useRef } from "react";

function Globe() {
  const earth = useRef();
  const ring = useRef();

  useFrame((state, delta) => {
    earth.current.rotation.y += delta * 0.4;
    earth.current.rotation.x += delta * 0.05;

    ring.current.rotation.z += delta * 0.8;
    ring.current.rotation.x += delta * 0.3;
  });

  return (
    <>
      {/* Earth */}
      <mesh ref={earth}>
        <sphereGeometry args={[1.3, 64, 64]} />
        <meshStandardMaterial
          color="#2563eb"
          metalness={0.8}
          roughness={0.2}
          emissive="#1d4ed8"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Neon Ring */}
      <mesh ref={ring} rotation={[1.2, 0, 0]}>
        <torusGeometry args={[1.9, 0.05, 16, 100]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={4}
        />
      </mesh>

      {/* Floating Cube */}
      <Float speed={2} rotationIntensity={2} floatIntensity={2}>
        <mesh position={[2.2, 1.3, 0]}>
          <boxGeometry args={[0.35, 0.35, 0.35]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={2}
          />
        </mesh>
      </Float>

      {/* Floating Sphere */}
      <Float speed={3} rotationIntensity={3}>
        <mesh position={[-2.3, -1.1, 0]}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#a855f7"
            emissiveIntensity={3}
          />
        </mesh>
      </Float>
    </>
  );
}

export default function Earth() {
  return (
    <div
      style={{
        width: "100%",
        height: "600px",
      }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <color attach="background" args={["transparent"]} />

        <ambientLight intensity={1.2} />

        <directionalLight
          position={[5, 5, 5]}
          intensity={2}
        />

        <pointLight
          position={[-5, -5, 5]}
          intensity={3}
          color="#3b82f6"
        />

        <Stars
          radius={100}
          depth={60}
          count={4000}
          factor={5}
          fade
        />

        <Globe />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={1}
        />
      </Canvas>
    </div>
  );
}