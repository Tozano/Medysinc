// ============================================================
// MédiSync — 3D Pill Dispenser Scene (React Three Fiber)
// ============================================================

import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Text, Environment, Float } from '@react-three/drei'
import * as THREE from 'three'
import { Compartment, CompartmentState, TimeSlot } from '../core/types'
import { usePillboxStore } from '../core/store/usePillboxStore'

// ── Color Map ────────────────────────────────────────────────
const STATE_COLORS: Record<CompartmentState, string> = {
  [CompartmentState.LOCKED]: '#2d3748',
  [CompartmentState.READY]: '#00b4d8',
  [CompartmentState.OPEN]: '#48cae4',
  [CompartmentState.TAKEN]: '#06d6a0',
  [CompartmentState.MISSED]: '#ef476f',
}

const STATE_EMISSIVE: Record<CompartmentState, string> = {
  [CompartmentState.LOCKED]: '#000000',
  [CompartmentState.READY]: '#005577',
  [CompartmentState.OPEN]: '#006688',
  [CompartmentState.TAKEN]: '#024a38',
  [CompartmentState.MISSED]: '#7a1a30',
}

const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Matin',
  noon: 'Midi',
  evening: 'Soir',
  night: 'Nuit',
}

const SLOT_ICONS: Record<TimeSlot, string> = {
  morning: '🌅',
  noon: '☀️',
  evening: '🌆',
  night: '🌙',
}

// ── Pulsing Glow Ring ────────────────────────────────────────
function GlowRing({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (meshRef.current) {
      const t = Date.now() * 0.002
      meshRef.current.scale.setScalar(1 + Math.sin(t) * 0.15)
      ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.3 + Math.sin(t) * 0.2
    }
  })
  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.52, 0.04, 8, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </mesh>
  )
}

// ── Single Compartment Mesh ──────────────────────────────────
interface CompartmentMeshProps {
  compartment: Compartment
  position: [number, number, number]
  isActive: boolean
  onClick: () => void
}

function CompartmentMesh({ compartment, position, isActive, onClick }: CompartmentMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lidRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const color = STATE_COLORS[compartment.state]
  const emissive = STATE_EMISSIVE[compartment.state]
  const isOpen = compartment.state === CompartmentState.OPEN
  const isReady = compartment.state === CompartmentState.READY
  const isMissed = compartment.state === CompartmentState.MISSED

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Hover lift effect
      const targetY = hovered || isActive ? 0.08 : 0
      meshRef.current.position.y +=
        (targetY - meshRef.current.position.y) * 0.1

      // Ready state pulse
      if (isReady) {
        const t = Date.now() * 0.003
        const mat = meshRef.current.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.3 + Math.sin(t) * 0.3
      }
    }

    // Lid animation
    if (lidRef.current) {
      const targetRotX = isOpen || isActive ? -Math.PI / 2 : 0
      lidRef.current.rotation.x +=
        (targetRotX - lidRef.current.rotation.x) * 0.12
    }
  })

  return (
    <group position={position}>
      {/* Compartment body */}
      <RoundedBox
        ref={meshRef}
        args={[0.9, 0.55, 0.9]}
        radius={0.08}
        smoothness={4}
        onClick={onClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        castShadow
      >
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={isReady ? 0.5 : isMissed ? 0.4 : 0.1}
          roughness={0.3}
          metalness={0.4}
        />
      </RoundedBox>

      {/* Lid */}
      <mesh
        ref={lidRef}
        position={[0, 0.275, -0.45]}
        rotation={[0, 0, 0]}
      >
        <boxGeometry args={[0.88, 0.05, 0.9]} />
        <meshStandardMaterial
          color={hovered || isActive ? '#48cae4' : '#1a3a5c'}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      {/* Pills inside (visible when open) */}
      {(isOpen || compartment.state === CompartmentState.TAKEN) &&
        compartment.medications.map((med, i) => (
          <mesh
            key={med.id}
            position={[
              (i % 2 === 0 ? -0.15 : 0.15),
              -0.15,
              (Math.floor(i / 2) * 0.2 - 0.1),
            ]}
          >
            <capsuleGeometry args={[0.05, 0.12, 4, 8]} />
            <meshStandardMaterial
              color={med.color}
              roughness={0.1}
              metalness={0.2}
            />
          </mesh>
        ))}

      {/* Glow ring for READY and MISSED */}
      {(isReady || isMissed) && (
        <GlowRing
          position={[0, -0.28, 0]}
          color={isReady ? '#00b4d8' : '#ef476f'}
        />
      )}

      {/* Time label */}
      <Text
        position={[0, -0.42, 0]}
        fontSize={0.1}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
        >
        {compartment.scheduledTime}
      </Text>

      {/* Slot label */}
      <Text
        position={[0, 0.44, 0]}
        fontSize={0.095}
        color="#e2e8f0"
        anchorX="center"
        anchorY="middle"
        >
        {SLOT_LABELS[compartment.slot]}
      </Text>

      {/* Stock indicator dots */}
      <group position={[0.35, 0.05, 0.45]}>
        {Array.from({ length: Math.min(5, Math.ceil(compartment.stock / 5)) }).map(
          (_, i) => (
            <mesh key={i} position={[0, i * 0.08, 0]}>
              <sphereGeometry args={[0.025]} />
              <meshStandardMaterial
                color={compartment.stock <= compartment.lowStockThreshold ? '#ef476f' : '#06d6a0'}
                emissive={compartment.stock <= compartment.lowStockThreshold ? '#7a1a30' : '#024a38'}
                emissiveIntensity={0.5}
              />
            </mesh>
          )
        )}
      </group>
    </group>
  )
}

// ── Pillbox Base/Body ────────────────────────────────────────
function PillboxBody() {
  return (
    <>
      {/* Main chassis */}
      <RoundedBox args={[4.4, 0.15, 1.4]} radius={0.1} smoothness={4} position={[0, -0.4, 0]} receiveShadow>
        <meshStandardMaterial color="#0a1f3d" roughness={0.3} metalness={0.7} />
      </RoundedBox>

      {/* Back panel */}
      <RoundedBox args={[4.4, 1.1, 0.08]} radius={0.05} position={[0, 0.15, -0.65]} receiveShadow>
        <meshStandardMaterial color="#0a1628" roughness={0.4} metalness={0.6} />
      </RoundedBox>

      {/* Side walls */}
      <RoundedBox args={[0.08, 1.1, 1.4]} radius={0.03} position={[-2.24, 0.15, 0]} receiveShadow>
        <meshStandardMaterial color="#0a1628" roughness={0.4} metalness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.08, 1.1, 1.4]} radius={0.03} position={[2.24, 0.15, 0]} receiveShadow>
        <meshStandardMaterial color="#0a1628" roughness={0.4} metalness={0.6} />
      </RoundedBox>

      {/* Logo plate */}
      <RoundedBox args={[1.2, 0.2, 0.04]} radius={0.03} position={[0, -0.3, 0.72]}>
        <meshStandardMaterial color="#00b4d8" roughness={0.2} metalness={0.8} emissive="#002233" emissiveIntensity={0.3} />
      </RoundedBox>

      {/* LED strip */}
      <mesh position={[0, -0.32, 0.73]}>
        <boxGeometry args={[4.2, 0.03, 0.02]} />
        <meshStandardMaterial color="#00b4d8" emissive="#00b4d8" emissiveIntensity={1.5} />
      </mesh>

      {/* WiFi indicator */}
      <mesh position={[1.9, -0.28, 0.72]}>
        <sphereGeometry args={[0.04]} />
        <meshStandardMaterial color="#06d6a0" emissive="#06d6a0" emissiveIntensity={2} />
      </mesh>
    </>
  )
}

// ── Main 3D Scene ────────────────────────────────────────────
interface PillDispenser3DProps {
  onCompartmentClick?: (compartment: Compartment) => void
}

export function PillDispenser3D({ onCompartmentClick }: PillDispenser3DProps) {
  const { device, activeCompartmentId, setActiveCompartment } = usePillboxStore()
  const compartments = device?.compartments ?? []

  // Layout: 4 compartments side by side
  const positions: [number, number, number][] = [
    [-1.62, 0, 0],
    [-0.54, 0, 0],
    [0.54, 0, 0],
    [1.62, 0, 0],
  ]

  const handleCompartmentClick = (compartment: Compartment) => {
    setActiveCompartment(
      activeCompartmentId === compartment.id ? null : compartment.id
    )
    onCompartmentClick?.(compartment)
  }

  return (
    <group>
      <PillboxBody />
      {compartments.map((compartment, i) => (
        <CompartmentMesh
          key={compartment.id}
          compartment={compartment}
          position={positions[i] ?? [i * 1.08 - 1.62, 0, 0]}
          isActive={activeCompartmentId === compartment.id}
          onClick={() => handleCompartmentClick(compartment)}
        />
      ))}
    </group>
  )
}

// ── Canvas Wrapper ───────────────────────────────────────────
interface PillDispenserCanvasProps {
  onCompartmentClick?: (compartment: Compartment) => void
  height?: string
}

export function PillDispenserCanvas({
  onCompartmentClick,
  height = '340px',
}: PillDispenserCanvasProps) {
  return (
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-3, 3, 3]} intensity={0.8} color="#00b4d8" />
        <pointLight position={[3, 1, -2]} intensity={0.4} color="#48cae4" />

        {/* Scene */}
        <Float speed={0.6} rotationIntensity={0.05} floatIntensity={0.1}>
          <PillDispenser3D onCompartmentClick={onCompartmentClick} />
        </Float>

        {/* Camera */}
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={9}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={false}
          enableDamping
          dampingFactor={0.05}
        />

        {/* Fog */}
        <fog attach="fog" args={['#060d1f', 15, 30]} />
      </Canvas>
    </div>
  )
}
