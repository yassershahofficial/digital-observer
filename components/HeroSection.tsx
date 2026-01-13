'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Eyeball from './Eyeball';
import DynamicText from './DynamicText';
import { ISiteConfig } from '@/models/SiteConfig';

export default function HeroSection() {
  const [siteConfig, setSiteConfig] = useState<ISiteConfig | null>(null);
  const [isVerticalLayout, setIsVerticalLayout] = useState(false);

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

  useEffect(() => {
    const checkLayout = () => {
      // Switch to vertical layout when screen width is too narrow (titles would touch)
      // Using 1024px as breakpoint where titles start to overlap
      setIsVerticalLayout(window.innerWidth < 1024);
    };

    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  return (
    <section className="fixed inset-0 w-full h-screen z-10 bg-black">
      {/* Stars Background */}
      <div className="absolute inset-0 stars-background" />
      
      {/* Eyeball - WebGL Canvas only for eyeball */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 40 }}
          dpr={typeof window !== 'undefined' ? window.devicePixelRatio : 1}
        >
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight color={0xffffff} intensity={0.8} />
            <spotLight 
              color={0xffffff} 
              intensity={8} 
              position={[5, 5, 10]}
            />
            <pointLight 
              color={0xffffff} 
              intensity={3} 
              position={[-5, 5, 8]}
            />
            <directionalLight 
              color={0xffffff} 
              intensity={0.5} 
              position={[0, 0, 5]}
            />
            
            {/* 3D Procedural Eyeball */}
            <Eyeball />
          </Suspense>
        </Canvas>
      </div>

      {/* Text Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {siteConfig && (
          isVerticalLayout ? (
            // Vertical Layout: Top and Bottom (centered with proper spacing)
            <>
              {/* Top Title (Left Title) */}
              <div className="absolute top-16 sm:top-20 md:top-24 left-0 right-0 w-full px-4 sm:px-6">
                {(() => {
                  const text = siteConfig.heroTitleLeft;
                  const words = text.split(' ');
                  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
                  const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
                  return (
                    <div className="curved-text-center w-full max-w-full">
                      <DynamicText
                        text={line1}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white block leading-tight text-center mb-1 sm:mb-2 break-words"
                      />
                      <DynamicText
                        text={line2}
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white block leading-tight text-center break-words"
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Bottom Title (Right Title) */}
              <div className="absolute bottom-24 sm:bottom-32 md:bottom-40 left-0 right-0 w-full px-4 sm:px-6">
                {(() => {
                  const text = siteConfig.heroTitleRight;
                  const words = text.split(' ');
                  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
                  const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
                  return (
                    <div className="curved-text-center w-full max-w-full">
                      <DynamicText
                        text={line1}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white block leading-tight text-center mb-1 sm:mb-2 break-words"
                      />
                      <DynamicText
                        text={line2}
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white block leading-tight text-center break-words"
                      />
                    </div>
                  );
                })()}
              </div>
            </>
          ) : (
            // Horizontal Layout: Left and Right
            <>
              {/* Left Title - 2 lines (right aligned) */}
              <div className="absolute left-4 md:left-8 lg:left-16 top-1/2 transform -translate-y-1/2">
                {(() => {
                  const text = siteConfig.heroTitleLeft;
                  const words = text.split(' ');
                  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
                  const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
                  return (
                    <div className="curved-text-left responsive-title">
                      <DynamicText
                        text={line1}
                        className="font-black text-white block leading-tight mb-2 responsive-title-line1 text-right"
                      />
                      <DynamicText
                        text={line2}
                        className="font-black text-white block leading-tight responsive-title-line2 text-right"
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Right Title - 2 lines (left aligned) */}
              <div className="absolute right-4 md:right-8 lg:right-16 top-1/2 transform -translate-y-1/2">
                {(() => {
                  const text = siteConfig.heroTitleRight;
                  const words = text.split(' ');
                  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
                  const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
                  return (
                    <div className="curved-text-right responsive-title">
                      <DynamicText
                        text={line1}
                        className="font-black text-white block leading-tight text-left mb-2 responsive-title-line1"
                      />
                      <DynamicText
                        text={line2}
                        className="font-black text-white block leading-tight text-left responsive-title-line2"
                      />
                    </div>
                  );
                })()}
              </div>
            </>
          )
        )}

        {/* Subtitle on Top */}
        {siteConfig?.heroSubtitle && (
          <div className="absolute top-8 sm:top-12 md:top-16 lg:top-20 left-1/2 transform -translate-x-1/2 px-4 w-full max-w-full">
            <DynamicText
              text={siteConfig.heroSubtitle}
              className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-300 text-center break-words"
            />
          </div>
        )}

        {/* Scroll Prompt */}
        <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-1/2 transform -translate-x-1/2 text-center px-4 w-full max-w-full">
          <p className="text-white text-sm sm:text-base md:text-lg mb-2 opacity-80 break-words">
            {siteConfig?.scrollPromptText || 'Scroll to explore'}
          </p>
          <div className="flex justify-center">
            <svg
              className="w-6 h-6 text-white opacity-80 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
