import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoBackground } from '@/hooks/useVideoBackground';

interface VideoBackgroundProps {
  /** Optional className for the container */
  className?: string;
  /** Overlay opacity (0-1), default 0.55 */
  overlayOpacity?: number;
  /** Transition duration in seconds, default 1.5 */
  transitionDuration?: number;
}

/**
 * Full-screen video background component with smooth crossfade transitions.
 * 
 * Features:
 * - Randomly cycles through b-roll videos
 * - Smooth crossfade transitions between videos
 * - Dark overlay for content readability
 * - Respects prefers-reduced-motion accessibility setting
 * - Fallback gradient for loading/error states
 * - Preloads next video for seamless transitions
 */
export function VideoBackground({
  className = '',
  overlayOpacity = 0.55,
  transitionDuration = 1.5,
}: VideoBackgroundProps) {
  const {
    currentVideo,
    nextVideo,
    isReady,
    prefersReducedMotion,
    transitionToNext,
  } = useVideoBackground();

  const primaryVideoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState<'primary' | 'secondary'>('primary');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [videosLoaded, setVideosLoaded] = useState(false);

  // Handle video end - trigger transition to next video
  const handleVideoEnd = useCallback(() => {
    if (prefersReducedMotion || isTransitioning) return;

    setIsTransitioning(true);
    
    // Prepare next video on the inactive player
    const inactiveVideo = activeVideo === 'primary' ? secondaryVideoRef.current : primaryVideoRef.current;
    if (inactiveVideo) {
      inactiveVideo.src = nextVideo;
      inactiveVideo.load();
      inactiveVideo.play().catch(() => {
        // Autoplay may be blocked, that's okay
      });
    }

    // Swap active video after a brief delay to allow loading
    setTimeout(() => {
      setActiveVideo(prev => prev === 'primary' ? 'secondary' : 'primary');
      transitionToNext();
      
      // Allow next transition after current completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, transitionDuration * 1000);
    }, 100);
  }, [activeVideo, nextVideo, prefersReducedMotion, isTransitioning, transitionToNext, transitionDuration]);

  // Initialize primary video
  useEffect(() => {
    if (!isReady || !currentVideo || prefersReducedMotion) return;

    const video = primaryVideoRef.current;
    if (video) {
      video.src = currentVideo;
      video.load();
      video.play().catch(() => {
        // Autoplay may be blocked
      });
    }
  }, [isReady, currentVideo, prefersReducedMotion]);

  // Handle video loaded
  const handleVideoLoaded = useCallback(() => {
    setVideosLoaded(true);
  }, []);

  // If reduced motion is preferred, show static gradient
  if (prefersReducedMotion) {
    return (
      <div 
        className={`fixed inset-0 -z-10 ${className}`}
        aria-hidden="true"
      >
        {/* Static gradient background for reduced motion */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        
        {/* Subtle animated gradient overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(208, 39, 29, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(30, 64, 175, 0.15) 0%, transparent 50%)',
          }}
        />
        
        {/* Dark overlay */}
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      </div>
    );
  }

  return (
    <div 
      className={`fixed inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Fallback gradient (visible while videos load) */}
      <AnimatePresence>
        {!videosLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          />
        )}
      </AnimatePresence>

      {/* Primary Video */}
      <motion.video
        ref={primaryVideoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        autoPlay
        onEnded={activeVideo === 'primary' ? handleVideoEnd : undefined}
        onLoadedData={handleVideoLoaded}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: activeVideo === 'primary' ? 1 : 0,
          scale: activeVideo === 'primary' ? 1 : 1.05,
        }}
        transition={{ 
          duration: transitionDuration,
          ease: 'easeInOut',
        }}
        style={{
          filter: 'brightness(0.8) saturate(1.1)',
        }}
      />

      {/* Secondary Video (for crossfade transitions) */}
      <motion.video
        ref={secondaryVideoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        autoPlay
        onEnded={activeVideo === 'secondary' ? handleVideoEnd : undefined}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: activeVideo === 'secondary' ? 1 : 0,
          scale: activeVideo === 'secondary' ? 1 : 1.05,
        }}
        transition={{ 
          duration: transitionDuration,
          ease: 'easeInOut',
        }}
        style={{
          filter: 'brightness(0.8) saturate(1.1)',
        }}
      />

      {/* Gradient overlay for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(0,0,0,0.3) 100%),
            linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%)
          `,
        }}
      />

      {/* Dark overlay for readability */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        style={{ opacity: overlayOpacity }}
      />

      {/* Subtle vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 200px 50px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  );
}

export default VideoBackground;

