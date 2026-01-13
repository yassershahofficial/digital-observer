'use client';

import { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { CanvasTexture, RepeatWrapping } from 'three';
import TVModel from './TVModel';
import VCRModel from './VCRModel';
import PlateStack, { PlateStackRef } from './PlateStack';
import { IProject } from '@/models/Project';
import { ISiteConfig } from '@/models/SiteConfig';

// Constants
const WOOD_COLORS = {
  base: '#D4A574',
  dark: '#A67C52',
  light: '#E8C5A0',
} as const;

const LIGHTING_CONFIG = {
  ambient: { color: 0xffffff, intensity: 2.5 },
  directional: {
    color: 0xffffff,
    intensity: 4.0,
    position: [5, 8, 5] as [number, number, number],
    shadow: {
      mapSize: { width: 2048, height: 2048 },
      camera: { far: 50, left: -10, right: 10, top: 10, bottom: -10 },
    },
  },
  pointLights: [
    { color: 0xffffff, intensity: 3.5, position: [0, 3, 0] as [number, number, number], distance: 25 },
    { color: 0xffffff, intensity: 2.5, position: [0, 2, 2] as [number, number, number], distance: 22 },
    { color: 0xffffff, intensity: 2.5, position: [3, 1, 0] as [number, number, number], distance: 20 },
  ],
} as const;

const CANVAS_CONFIG = {
  camera: { position: [0, 2, 8] as [number, number, number], fov: 50 },
  dpr: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
} as const;

const ANIMATION_DELAYS = {
  loadingScreen: 1000,
  videoLoad: 1500,
} as const;

function WoodenPlane() {
  const woodTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    // Fill with base color
    ctx.fillStyle = WOOD_COLORS.base;
    ctx.fillRect(0, 0, 512, 512);
    
    // Create wood grain pattern
    for (let i = 0; i < 512; i += 2) {
      const noise = Math.sin(i * 0.1) * 0.3 + Math.random() * 0.2;
      const brightness = 0.8 + noise * 0.3;
      
      ctx.fillStyle = `rgba(${Math.floor(212 * brightness)}, ${Math.floor(165 * brightness)}, ${Math.floor(116 * brightness)}, 0.9)`;
      ctx.fillRect(0, i, 512, 2);
    }
    
    // Add darker grain lines
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * 512;
      const thickness = 1 + Math.random() * 2;
      ctx.fillStyle = WOOD_COLORS.dark;
      ctx.fillRect(0, y, 512, thickness);
    }
    
    // Add lighter highlights
    for (let i = 0; i < 15; i++) {
      const y = Math.random() * 512;
      const thickness = 0.5 + Math.random();
      ctx.fillStyle = WOOD_COLORS.light;
      ctx.fillRect(0, y, 512, thickness);
    }
    
    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }, []);
  
  if (!woodTexture) return null;
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial 
        map={woodTexture}
        color={0xD4A574}
        roughness={0.6}
        metalness={0.05}
      />
    </mesh>
  );
}

// YouTube URL regex - compiled once
const YOUTUBE_REGEX = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

// Extract video ID from YouTube URL
const getYouTubeVideoId = (url: string | undefined): string | null => {
  if (!url) return null;
  const match = url.match(YOUTUBE_REGEX);
  return match && match[2]?.length === 11 ? match[2] : null;
};

export default function VCRStation() {
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [videoControl, setVideoControl] = useState<{ togglePause: () => void } | null>(null);
  const plateStackRef = useRef<PlateStackRef>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [siteConfig, setSiteConfig] = useState<ISiteConfig | null>(null);

  // Handle cassette reset
  const handleStop = () => {
    plateStackRef.current?.reset();
  };

  // Handle project selection
  const handleCassetteSelect = (project: IProject | null) => {
    setSelectedProject(project);
  };

  // Fetch site config
  useEffect(() => {
    async function fetchSiteConfig() {
      try {
        const res = await fetch('/api/site-config');
        if (res.ok) {
          const data = await res.json();
          setSiteConfig(data.data);
        }
      } catch (error) {
        console.error('Error fetching site config:', error);
      }
    }

    fetchSiteConfig();
  }, []);

  // Check for mobile layout (window width < 1024px)
  useEffect(() => {
    const checkLayout = () => {
      setIsMobileLayout(window.innerWidth < 1024);
    };

    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  // Delay loading screen and video loading until cassette animation completes
  useEffect(() => {
    if (!selectedProject) {
      setShowLoadingScreen(false);
      setShouldLoadVideo(false);
      return;
    }

    setShowLoadingScreen(false);
    setShouldLoadVideo(false);
    
    const loadingTimer = setTimeout(() => {
      setShowLoadingScreen(true);
    }, ANIMATION_DELAYS.loadingScreen);
    
    const videoTimer = setTimeout(() => {
      setShouldLoadVideo(true);
    }, ANIMATION_DELAYS.videoLoad);
    
    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(videoTimer);
    };
  }, [selectedProject]);

  // Memoize video URL calculations
  const videoId = useMemo(
    () => (selectedProject && shouldLoadVideo ? getYouTubeVideoId(selectedProject.youtubeUrl) : null),
    [selectedProject, shouldLoadVideo]
  );

  const embedUrl = useMemo(
    () => videoId 
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&modestbranding=1&showinfo=0&rel=0&fs=0&disablekb=1&enablejsapi=1`
      : null,
    [videoId]
  );

  return (
    <section
      className="relative w-full min-h-screen z-20 bg-black"
      style={{ 
        marginTop: '100vh',
      }}
    >
      {/* Text Overlay */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {/* Section Title */}
        {siteConfig?.vcrSectionTitle && (
          <div className={`absolute top-8 sm:top-12 md:top-16 px-4 w-full max-w-full ${
            isMobileLayout 
              ? 'left-1/2 transform -translate-x-1/2' 
              : 'right-8 lg:right-16'
          }`}>
            <h2 className={`vcr-section-title text-white ${
              isMobileLayout ? 'text-center' : 'text-right'
            }`}>
              {siteConfig.vcrSectionTitle}
            </h2>
          </div>
        )}

        {/* Instruction Text */}
        {siteConfig?.vcrInstructionText && (
          <div className="absolute bottom-24 sm:bottom-28 md:bottom-32 left-1/2 transform -translate-x-1/2 px-4 w-full max-w-full">
            <p className="vcr-instruction-text text-gray-300 text-center">
              {siteConfig.vcrInstructionText}
            </p>
          </div>
        )}
      </div>

      <div className="absolute inset-0">
        <Canvas 
          camera={CANVAS_CONFIG.camera} 
          dpr={CANVAS_CONFIG.dpr} 
          shadows
          gl={{ alpha: true, antialias: true }}
        >
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight color={LIGHTING_CONFIG.ambient.color} intensity={LIGHTING_CONFIG.ambient.intensity} />
            <directionalLight
              color={LIGHTING_CONFIG.directional.color}
              intensity={LIGHTING_CONFIG.directional.intensity}
              position={LIGHTING_CONFIG.directional.position}
              castShadow
              shadow-mapSize-width={LIGHTING_CONFIG.directional.shadow.mapSize.width}
              shadow-mapSize-height={LIGHTING_CONFIG.directional.shadow.mapSize.height}
              shadow-camera-far={LIGHTING_CONFIG.directional.shadow.camera.far}
              shadow-camera-left={LIGHTING_CONFIG.directional.shadow.camera.left}
              shadow-camera-right={LIGHTING_CONFIG.directional.shadow.camera.right}
              shadow-camera-top={LIGHTING_CONFIG.directional.shadow.camera.top}
              shadow-camera-bottom={LIGHTING_CONFIG.directional.shadow.camera.bottom}
            />
            {LIGHTING_CONFIG.pointLights.map((light, idx) => (
              <pointLight
                key={idx}
                color={light.color}
                intensity={light.intensity}
                position={light.position}
                distance={light.distance}
                decay={1}
              />
            ))}

            <WoodenPlane />

            <TVModel 
              showVideo={!!embedUrl} 
              youtubeUrl={embedUrl} 
              projectName={selectedProject?.name || ''}
              showLoading={showLoadingScreen && !embedUrl}
              onVideoControlReady={setVideoControl}
              isMobileLayout={isMobileLayout}
            />
            
            <VCRModel 
              onToggleVideo={videoControl?.togglePause}
              hasVideo={!!embedUrl}
              onStop={handleStop}
              isMobileLayout={isMobileLayout}
            />
            
            <PlateStack ref={plateStackRef} onCassetteSelect={handleCassetteSelect} isMobileLayout={isMobileLayout} />
          </Suspense>
        </Canvas>
      </div>

    </section>
  );
}
