'use client';

import { useEffect, useState, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { CanvasTexture, Group } from 'three';
import { IProject } from '@/models/Project';
import gsap from 'gsap';

// Function to create label texture (similar to the HTML code)
function createLabelTexture(text: string, color: string = '#3b82f6'): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128; // Rectangular label
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Background
  ctx.fillStyle = '#eeeeee';
  ctx.fillRect(0, 0, 512, 128);

  // Colored stripe on the side
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 40, 128);

  // Border
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 512, 128);

  // Text with improved clarity
  ctx.font = 'bold 60px "Courier New", monospace';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Add text shadow for better readability
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  ctx.fillText(text, 276, 64);
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  const tex = new CanvasTexture(canvas);
  return tex;
}

// VCR slot position constants
const VCR_SLOT_OFFSET = [0, 0.1, 0.35] as [number, number, number];
const FORWARD_OFFSET = 0.10; // Amount to pop cassette forward
const RIGHT_OFFSET = 0.50; // Amount to shift cassette to the right
const CASSETTE_THICKNESS = 0.48;

// Desktop layout constants
const VCR_POSITION_DESKTOP = [-2.0, -1.5, 0] as [number, number, number];
const VCR_ROTATION_Y_DESKTOP = Math.PI / 4 - Math.PI / 9;
const STACK_POSITION_DESKTOP: [number, number, number] = [3, -2 + CASSETTE_THICKNESS / 2, 0];

// Mobile layout constants
const VCR_POSITION_MOBILE = [0, -1.5, 0] as [number, number, number];
const VCR_ROTATION_Y_MOBILE = 0;
const STACK_POSITION_MOBILE: [number, number, number] = [2.5, -2 + CASSETTE_THICKNESS / 2, 1.8]; // Forward Z position to be in front of TV/VCR

// Helper function to calculate VCR slot world position
function calculateVCRSlotPosition(isMobileLayout: boolean, stackPosition: [number, number, number]): [number, number, number] {
  const vcrPosition = isMobileLayout ? VCR_POSITION_MOBILE : VCR_POSITION_DESKTOP;
  const vcrRotationY = isMobileLayout ? VCR_ROTATION_Y_MOBILE : VCR_ROTATION_Y_DESKTOP;
  
  // Calculate rotated slot offset (rotate by VCR rotation around Y axis)
  const slotOffsetZ = VCR_SLOT_OFFSET[2] + FORWARD_OFFSET;
  const slotOffsetX = VCR_SLOT_OFFSET[0] + RIGHT_OFFSET;
  const rotatedOffsetX = slotOffsetX * Math.cos(vcrRotationY) - slotOffsetZ * Math.sin(vcrRotationY);
  const rotatedOffsetZ = slotOffsetX * Math.sin(vcrRotationY) + slotOffsetZ * Math.cos(vcrRotationY);
  
  // VCR slot world position relative to stack group origin
  return [
    vcrPosition[0] - stackPosition[0] + rotatedOffsetX,
    vcrPosition[1] - stackPosition[1] + VCR_SLOT_OFFSET[1],
    vcrPosition[2] - stackPosition[2] + rotatedOffsetZ,
  ];
}

// Individual Cassette Component
function Cassette({ 
  project, 
  index,
  basePosition,
  baseRotation,
  cassetteThickness,
  isAnimating,
  isInVCR,
  onClick,
  stackPosition,
  vcrSlotPosition,
  vcrRotationY
}: { 
  project: IProject;
  index: number;
  basePosition: [number, number, number];
  baseRotation: number;
  cassetteThickness: number;
  isAnimating: boolean;
  isInVCR: boolean;
  onClick: () => void;
  stackPosition: [number, number, number];
  vcrSlotPosition: [number, number, number];
  vcrRotationY: number;
}) {
  const groupRef = useRef<Group>(null);
  const labelTexture = useMemo(
    () => createLabelTexture(project.name),
    [project.name]
  );

  // Scale factors - making cassettes larger
  const scaleX = 1.8 / 2.5;
  const scaleY = 0.48 / 0.4;
  const scaleZ = 1.2 / 1.4;

  // Calculate target position based on state
  // basePosition is already relative to stack group, so use it directly
  const targetPosition: [number, number, number] = isInVCR 
    ? vcrSlotPosition 
    : basePosition;

  const targetRotation: [number, number, number] = isInVCR
    ? [0, vcrRotationY, 0]
    : [0, 0, baseRotation];

  // Animate position and rotation
  useEffect(() => {
    if (groupRef.current) {
      gsap.to(groupRef.current.position, {
        x: targetPosition[0],
        y: targetPosition[1],
        z: targetPosition[2],
        duration: 1,
        ease: 'power2.inOut',
      });
      
      gsap.to(groupRef.current.rotation, {
        x: targetRotation[0],
        y: targetRotation[1],
        z: targetRotation[2],
        duration: 1,
        ease: 'power2.inOut',
      });
    }
  }, [targetPosition, targetRotation]);

  return (
    <group
      ref={groupRef}
      position={basePosition}
      rotation={[0, 0, baseRotation]}
      scale={[scaleX, scaleY, scaleZ]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        if (!isAnimating && !isInVCR) {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* Cassette Body (Plastic Shell) */}
      <mesh castShadow>
        <boxGeometry args={[2.5, 0.4, 1.4]} />
        <meshStandardMaterial
          color={0x1a1a1a}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Label Sticker on Front Face */}
      <mesh position={[0, 0, 0.71]} castShadow>
        <boxGeometry args={[2.2, 0.25, 0.05]} />
        <meshStandardMaterial map={labelTexture} />
      </mesh>
    </group>
  );
}

export interface PlateStackRef {
  reset: () => void;
}

const PlateStack = forwardRef<PlateStackRef, { onCassetteSelect?: (project: IProject | null) => void; isMobileLayout?: boolean }>(
  ({ onCassetteSelect, isMobileLayout = false }, ref) => {
    const [projects, setProjects] = useState<IProject[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [cassettePositions, setCassettePositions] = useState<number[]>([]);
    const cassetteThickness = CASSETTE_THICKNESS;
    const stackPosition = isMobileLayout ? STACK_POSITION_MOBILE : STACK_POSITION_DESKTOP;
    const vcrSlotPosition = calculateVCRSlotPosition(isMobileLayout, stackPosition);
    const vcrRotationY = isMobileLayout ? VCR_ROTATION_Y_MOBILE : VCR_ROTATION_Y_DESKTOP;

    // Expose reset function via ref
    useImperativeHandle(ref, () => ({
      reset: () => {
        setSelectedIndex(null);
        onCassetteSelect?.(null);
        setCassettePositions(projects.map((_, i) => i * cassetteThickness));
      },
    }), [projects, onCassetteSelect, cassetteThickness]);

    useEffect(() => {
      async function fetchProjects() {
        try {
          const res = await fetch('/api/projects');
          if (res.ok) {
            const data = await res.json();
            const sortedProjects = (data.data || []).sort(
              (a: IProject, b: IProject) => (a.order || 0) - (b.order || 0)
            );
            setProjects(sortedProjects);
            // Initialize positions
            setCassettePositions(sortedProjects.map((_: IProject, i: number) => i * cassetteThickness));
          }
        } catch (error) {
          console.error('Error fetching projects:', error);
        }
      }

      fetchProjects();
    }, []);

    const handleCassetteClick = (index: number) => {
      if (selectedIndex !== null) return;

      const selectedProject = projects[index];
      if (!selectedProject) return;

      setSelectedIndex(index);
      onCassetteSelect?.(selectedProject);

      // Animate cassettes above the clicked one down
      setCassettePositions(prev => {
        const newPositions = [...prev];
        for (let i = index + 1; i < projects.length; i++) {
          newPositions[i] = (i - 1) * cassetteThickness;
        }
        return newPositions;
      });
    };

    return (
      <group position={stackPosition} castShadow>
        {projects.map((project, i) => {
          const yOffset = cassettePositions[i] ?? (i * cassetteThickness);
          const slightOffset = (i % 2 === 0 ? 1 : -1) * 0.05;
          const rotationZ = (i % 2 === 0 ? 1 : -1) * 0.01;

          return (
            <Cassette
              key={`cassette-${i}-${project._id}`}
              project={project}
              index={i}
              basePosition={[slightOffset, yOffset, 0]}
              baseRotation={rotationZ}
              cassetteThickness={cassetteThickness}
              isAnimating={selectedIndex === i}
              isInVCR={selectedIndex === i}
              onClick={() => handleCassetteClick(i)}
              stackPosition={stackPosition}
              vcrSlotPosition={vcrSlotPosition}
              vcrRotationY={vcrRotationY}
            />
          );
        })}
      </group>
    );
  }
);

PlateStack.displayName = 'PlateStack';

export default PlateStack;
