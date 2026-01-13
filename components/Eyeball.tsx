'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, CanvasTexture } from 'three';
import * as THREE from 'three';

export default function Eyeball() {
  const eyeGroupRef = useRef<Group>(null);
  const pupilRef = useRef<Mesh>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.9);
  const hasMouse = useRef(false);
  const lastMouseMoveTime = useRef(0);
  const animationTime = useRef(0);

  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      if (width < 640) {
        // Mobile
        setScale(0.6);
      } else if (width < 1024) {
        // Tablet
        setScale(0.75);
      } else {
        // Desktop
        setScale(0.9);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      hasMouse.current = true;
      lastMouseMoveTime.current = Date.now();
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      mousePosition.current = { x, y };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        const x = (touch.clientX / window.innerWidth) * 2 - 1;
        const y = -(touch.clientY / window.innerHeight) * 2 + 1;
        mousePosition.current = { x, y };
        lastMouseMoveTime.current = Date.now();
      }
    };

    // Check if device has mouse capability
    const checkMouseCapability = () => {
      hasMouse.current = window.matchMedia('(pointer: fine)').matches;
    };

    checkMouseCapability();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('pointermove', checkMouseCapability);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('pointermove', checkMouseCapability);
    };
  }, []);

  // Generate Sclera Texture (White + Red Veins)
  const scleraTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#dddddd';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.strokeStyle = '#aa0000';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 400; i++) {
      ctx.beginPath();
      let x = Math.random() * 1024;
      let y = Math.random() * 1024;
      ctx.moveTo(x, y);
      
      for (let j = 0; j < 10; j++) {
        x += (Math.random() - 0.5) * 50;
        y += (Math.random() - 0.5) * 50;
        if (Math.sqrt(Math.pow(x - 512, 2) + Math.pow(y - 512, 2)) < 300) break;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Generate Iris Texture (Blue Electric Fibers)
  const irisTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, 512, 512);
    ctx.translate(256, 256);
    
    for (let i = 0; i < 360; i += 0.5) {
      ctx.rotate(0.5 * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 256);
      
      const gradient = ctx.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, '#000');
      gradient.addColorStop(0.3, '#00aaff');
      gradient.addColorStop(0.8, '#004488');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1 + Math.random();
      ctx.stroke();
    }

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useFrame((state, delta) => {
    if (!eyeGroupRef.current || !pupilRef.current) return;

    // Check if mouse exists and was recently moved (within last 2 seconds)
    const timeSinceLastMove = Date.now() - lastMouseMoveTime.current;
    const isMouseActive = hasMouse.current && timeSinceLastMove < 2000;

    if (isMouseActive) {
      // Mouse exists and is active: Follow mouse/touch movement
      const targetRotY = mousePosition.current.x * 0.8;
      const targetRotX = -mousePosition.current.y * 0.8; // Inverted vertical
      
      eyeGroupRef.current.rotation.y += (targetRotY - eyeGroupRef.current.rotation.y) * 0.1;
      eyeGroupRef.current.rotation.x += (targetRotX - eyeGroupRef.current.rotation.x) * 0.1;

      // Pupil Dilation based on mouse distance
      const dist = Math.sqrt(
        mousePosition.current.x * mousePosition.current.x + 
        mousePosition.current.y * mousePosition.current.y
      );
      const targetScale = 0.8 + (dist * 0.6);
      const currentScale = pupilRef.current.scale.x;
      pupilRef.current.scale.set(
        currentScale + (targetScale - currentScale) * 0.1,
        currentScale + (targetScale - currentScale) * 0.1,
        1
      );
    } else {
      // No mouse or mouse inactive: Auto movement animation
      animationTime.current += delta;
      
      // Faster, smooth circular motion
      const speed = 0.8;
      const radius = 0.5;
      
      const targetRotY = Math.sin(animationTime.current * speed) * radius;
      const targetRotX = Math.cos(animationTime.current * speed * 0.8) * radius * 0.7;
      
      // Smoother interpolation for more fluid movement
      eyeGroupRef.current.rotation.y += (targetRotY - eyeGroupRef.current.rotation.y) * 0.15;
      eyeGroupRef.current.rotation.x += (targetRotX - eyeGroupRef.current.rotation.x) * 0.15;

      // Pupil dilation animation
      const pupilPulse = 0.75 + Math.sin(animationTime.current * 1.2) * 0.2;
      pupilRef.current.scale.set(pupilPulse, pupilPulse, 1);
    }
  });

  if (!scleraTexture || !irisTexture) return null;

  return (
    <group ref={eyeGroupRef} position={[0, 0, 0]} scale={scale}>
      {/* Layer 1: Sclera (The Ball) */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial 
          map={scleraTexture} 
          roughness={0.4}
        />
      </mesh>

      {/* Layer 2: Iris (The Color) */}
      <mesh position={[0, 0, 1.96]}>
        <circleGeometry args={[0.9, 64]} />
        <meshStandardMaterial 
          map={irisTexture} 
          roughness={0.2} 
          emissive={0x001133}
        />
      </mesh>

      {/* Layer 3: Pupil (The Hole) */}
      <mesh ref={pupilRef} position={[0, 0, 1.97]}>
        <circleGeometry args={[0.35, 64]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* Layer 4: Cornea (The Glossy Shield) */}
      <mesh>
        <sphereGeometry args={[2.05, 64, 64]} />
        <meshPhysicalMaterial 
          roughness={0} 
          transmission={0.2} 
          thickness={0.2} 
          transparent 
          opacity={0.1}
        />
      </mesh>
    </group>
  );
}
