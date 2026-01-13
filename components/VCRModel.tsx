'use client';

import { useState, useRef, useCallback } from 'react';
import { Text } from '@react-three/drei';
import { Mesh, Group } from 'three';
import gsap from 'gsap';

interface VCRModelProps {
  onToggleVideo?: () => void;
  hasVideo?: boolean;
  onStop?: () => void;
  isMobileLayout?: boolean;
}

// Constants
const BUTTON_ANIMATION = {
  pressIn: { duration: 0.1, ease: 'power2.out' },
  pressOut: { duration: 0.2, ease: 'power2.out' },
} as const;

const VCR_POSITION = [-2.0, -1.5, 0] as [number, number, number];
const VCR_ROTATION = [0, Math.PI / 4 - Math.PI / 9, 0] as [number, number, number];
const VCR_POSITION_MOBILE = [0, -1.5, 0] as [number, number, number];
const VCR_ROTATION_MOBILE = [0, 0, 0] as [number, number, number];

export default function VCRModel({ onToggleVideo, hasVideo = false, onStop, isMobileLayout = false }: VCRModelProps) {
  const [isPausePlayPressed, setIsPausePlayPressed] = useState(false);
  const [isStopPressed, setIsStopPressed] = useState(false);
  const pausePlayButtonGroupRef = useRef<Group>(null);
  const stopButtonGroupRef = useRef<Group>(null);

  // Generic button animation handler
  const animateButton = useCallback((
    buttonRef: React.RefObject<Group>,
    pressedState: boolean,
    setPressedState: (value: boolean) => void,
    pressZ: number,
    releaseZ: number,
    onComplete?: () => void
  ) => {
    if (pressedState || !buttonRef.current) return;
    
    setPressedState(true);
    
    gsap.to(buttonRef.current.position, {
      z: pressZ,
      ...BUTTON_ANIMATION.pressIn,
      onComplete: () => {
        gsap.to(buttonRef.current!.position, {
          z: releaseZ,
          ...BUTTON_ANIMATION.pressOut,
          onComplete: () => {
            setPressedState(false);
            onComplete?.();
          }
        });
      }
    });
  }, []);

  const handlePausePlayClick = (e: any) => {
    e.stopPropagation();
    animateButton(
      pausePlayButtonGroupRef,
      isPausePlayPressed,
      setIsPausePlayPressed,
      0.72,
      0.75,
      () => {
        if (hasVideo && onToggleVideo) {
          onToggleVideo();
        }
      }
    );
  };

  const handleStopClick = (e: any) => {
    e.stopPropagation();
    animateButton(
      stopButtonGroupRef,
      isStopPressed,
      setIsStopPressed,
      0.70,
      0.73,
      onStop
    );
  };

  const handlePointerOver = (e: any, isPressed: boolean) => {
    e.stopPropagation();
    if (!isPressed) {
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
  };

  const position = isMobileLayout ? VCR_POSITION_MOBILE : VCR_POSITION;
  const rotation = isMobileLayout ? VCR_ROTATION_MOBILE : VCR_ROTATION;

  return (
    <group position={position} rotation={rotation} castShadow>
      {/* VCR Body - Main Box */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[3.5, 1, 1.5]} />
        <meshStandardMaterial
          color={0x1a1a1a}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {/* VCR Top Panel */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[3.5, 0.05, 1.5]} />
        <meshStandardMaterial
          color={0x2a2a2a}
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>

      {/* Cassette Slot - sized to fit cassettes (1.8 x 0.48 x 1.2) */}
      <mesh position={[0, 0.1, 0.35]}>
        <boxGeometry args={[1.85, 0.5, 1.25]} />
        <meshStandardMaterial
          color={0x000000}
          roughness={0.8}
        />
      </mesh>

      {/* Green Button (Pause/Play) */}
      <group ref={pausePlayButtonGroupRef} position={[-1.3, 0, 0.75]}>
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          onClick={handlePausePlayClick}
          onPointerOver={(e) => handlePointerOver(e, isPausePlayPressed)}
          onPointerOut={handlePointerOut}
        >
          <cylinderGeometry args={[0.15, 0.15, 0.35, 32]} />
          <meshStandardMaterial color={0x00ff00} roughness={0.4} metalness={0.2} />
        </mesh>
        <Text position={[0, -0.3, 0.03]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle">
          Pause/Play
        </Text>
      </group>

      {/* Red Button (Release) */}
      <group ref={stopButtonGroupRef} position={[1.35, 0, 0.73]}>
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          onClick={handleStopClick}
          onPointerOver={(e) => handlePointerOver(e, isStopPressed)}
          onPointerOut={handlePointerOut}
        >
          <cylinderGeometry args={[0.15, 0.15, 0.35, 32]} />
          <meshStandardMaterial color={0xff0000} roughness={0.4} metalness={0.2} />
        </mesh>
        <Text position={[0, -0.3, 0.03]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle">
          Release
        </Text>
      </group>
    </group>
  );
}
