'use client';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Group, CanvasTexture } from 'three';
import * as THREE from 'three';

interface TVModelProps {
  showVideo?: boolean;
  youtubeUrl?: string | null;
  projectName?: string;
  showLoading?: boolean;
  onVideoControlReady?: (control: { togglePause: () => void }) => void;
  isMobileLayout?: boolean;
}

export default function TVModel({ showVideo = false, youtubeUrl = null, projectName = '', showLoading = false, onVideoControlReady, isMobileLayout = false }: TVModelProps) {
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const tvGroupRef = useRef<Group>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isPausedRef = useRef(false);

  // Keep loading screen visible for 1 second after YouTube URL is set (overlap)
  useEffect(() => {
    if (youtubeUrl) {
      setShowLoadingOverlay(true);
      isPausedRef.current = false; // Reset pause state when new video loads
      const timer = setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowLoadingOverlay(false);
      isPausedRef.current = false;
    }
  }, [youtubeUrl]);

  // Function to toggle pause/play using postMessage
  // Use useCallback to ensure stable reference
  const togglePause = useCallback(() => {
    // Always get the latest iframe reference
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow || !youtubeUrl) {
      console.warn('Cannot toggle video: iframe not ready', {
        hasIframe: !!iframe,
        hasContentWindow: !!iframe?.contentWindow,
        hasUrl: !!youtubeUrl
      });
      return;
    }

    // Toggle the pause state
    isPausedRef.current = !isPausedRef.current;
    
    // Send postMessage to YouTube iframe
    const command = isPausedRef.current
      ? '{"event":"command","func":"pauseVideo","args":""}'
      : '{"event":"command","func":"playVideo","args":""}';
    
    try {
      // Send to YouTube iframe - try both origins for compatibility
      iframe.contentWindow.postMessage(command, '*');
      // Also try with specific origin
      iframe.contentWindow.postMessage(command, 'https://www.youtube.com');
    } catch (error) {
      console.error('Error sending postMessage to YouTube:', error);
    }
  }, [youtubeUrl]);

  // Register video control callback - update when togglePause changes
  useEffect(() => {
    if (onVideoControlReady) {
      onVideoControlReady({ togglePause });
    }
  }, [onVideoControlReady, togglePause]);
  const screenRef = useRef<THREE.Mesh>(null);
  const staticTextureRef = useRef<CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Create static texture
  useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    canvasRef.current = canvas;
    
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    staticTextureRef.current = texture;
  }, []);

  useFrame(() => {
    // Subtle idle animation
    if (tvGroupRef.current) {
      const time = Date.now() * 0.001;
      tvGroupRef.current.position.y = 0.9 + Math.sin(time * 0.4) * 0.02;
    }

    // Update static texture for jitter effect
    if (canvasRef.current && staticTextureRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const imageData = ctx.createImageData(512, 512);
        const data = imageData.data;
        
        // Create TV static/jitter pattern
        for (let i = 0; i < data.length; i += 4) {
          // Random noise with some structure
          const value = Math.random() * 255;
          const intensity = Math.random() > 0.7 ? value : value * 0.3;
          
          data[i] = intensity;     // R
          data[i + 1] = intensity; // G
          data[i + 2] = intensity; // B
          data[i + 3] = 255;       // A
        }
        
        ctx.putImageData(imageData, 0, 0);
        staticTextureRef.current.needsUpdate = true;
      }
    }
  });


  const position = isMobileLayout ? [0, 0.9, 0] as [number, number, number] : [-2.0, 0.9, 0] as [number, number, number];
  const rotation = isMobileLayout ? [0, 0, 0] as [number, number, number] : [0, Math.PI / 4 - Math.PI / 9, 0] as [number, number, number];

  return (
    <group ref={tvGroupRef} position={position} rotation={rotation}>
      {/* TV Body - Main Frame */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[5.5, 3.4, 0.4]} />
        <meshStandardMaterial
          color={0x2a2a2a}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* TV Screen Bezel */}
      <mesh position={[0, 0, 0.22]} castShadow>
        <boxGeometry args={[5.3, 2.98, 0.12]} />
        <meshStandardMaterial
          color={0x1a1a1a}
          roughness={0.8}
        />
      </mesh>

      {/* TV Screen */}
      <mesh ref={screenRef} position={[0, 0, 0.28]}>
        <boxGeometry args={[5.1, 2.87, 0.06]} />
        <meshStandardMaterial
          map={staticTextureRef.current}
          roughness={0.9}
          emissive={0x1a1a1a}
          emissiveIntensity={0.5}
          emissiveMap={staticTextureRef.current}
        />
      </mesh>

      {/* Loading Screen (when cassette is in VCR but video not loaded yet, or overlapping with video) */}
      {((showLoading && !youtubeUrl) || showLoadingOverlay) && (
        <Html
          position={[0, 0, 0.31]}
          transform
          occlude
          style={{
            width: '204px',
            height: '116px',
            pointerEvents: 'auto',
          }}
          zIndexRange={[100, 0]}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              borderRadius: '2px',
              position: 'relative',
              backgroundColor: '#1a1a1a',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Loading Spinner */}
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid #333',
                borderTop: '3px solid #fff',
                borderRadius: '50%',
                animation: 'spin 1.5s linear infinite',
              }}
            />
            {/* Project Name */}
            {projectName && (
              <p
                style={{
                  marginTop: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  padding: '0 8px',
                }}
              >
                {projectName}
              </p>
            )}
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </Html>
      )}

      {/* YouTube Video Overlay on Screen */}
      {youtubeUrl && (
        <Html
          position={[0, 0, 0.31]}
          transform
          occlude
          style={{
            width: '204px',
            height: '116px',
            pointerEvents: 'auto',
          }}
          zIndexRange={[100, 0]}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              borderRadius: '2px',
              position: 'relative',
              backgroundColor: '#1a1a1a',
            }}
          >
            <iframe
              ref={iframeRef}
              width="100%"
              height="100%"
              src={youtubeUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              style={{
                pointerEvents: 'none',
                opacity: 0,
                transition: 'opacity 0.3s ease-in',
              }}
              onLoad={(e) => {
                // Delay before showing video
                setTimeout(() => {
                  const iframe = e.target as HTMLIFrameElement;
                  if (iframe) {
                    iframe.style.opacity = '1';
                    // Re-register callback when iframe is loaded to ensure it has the latest ref
                    if (onVideoControlReady) {
                      onVideoControlReady({ togglePause });
                    }
                  }
                }, 500);
              }}
            />
            {/* Transparent overlay to block all interactions with YouTube iframe */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
                zIndex: 10,
                pointerEvents: 'auto',
              }}
            />
          </div>
        </Html>
      )}

      {/* TV Stand */}
      <mesh position={[0, -1.7, 0]} castShadow>
        <boxGeometry args={[2, 0.4, 1]} />
        <meshStandardMaterial
          color={0x1a1a1a}
          roughness={0.7}
        />
      </mesh>
    </group>
  );
}
