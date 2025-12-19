import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * List of b-roll video files available in the public/videos directory.
 * These videos are used as rotating backgrounds on the login page.
 */
const VIDEO_FILES = [
  '_1_cloud_202512191400_57dzo.mp4',
  '_2_network_202512191400_2cj2x.mp4',
  '_3_server_202512191400_1wxsp.mp4',
  '_4_data_202512191400_vsow0.mp4',
  '_5_global_202512191400_ll5qx.mp4',
  '_6_dashboard_202512191415_z1s1u.mp4',
  '_7_fiber_202512191400_18xyw.mp4',
  '_8_cloud_202512191414_8ztj5.mp4',
  '_9_security_202512191400_4cfl4.mp4',
  '_10_data_202512191400_pp5iy.mp4',
  '_11_circuit_202512191400_nrthm.mp4',
  '_12_monitoring_202512191400_ifk6z.mp4',
  '_13_kubernetes_202512191400_fseud.mp4',
  '_14_encryption_202512191400_ucuku.mp4',
  '_15_alert_202512191400_0iyl9.mp4',
  '_16_cooling_202512191401_iop1o.mp4',
  '_17_api_202512191401_i2aan.mp4',
  '_18_time_202512191401_cx6lz.mp4',
  '_19_satellite_202512191401_ccy5o.mp4',
  '_20_load_202512191401_9i6f0.mp4',
  '_21_firewall_202512191401_c1gly.mp4',
  '_22_rack_202512191401_k66zl.mp4',
  '_24_submarine_202512191401_wri4x.mp4',
  '_25_control_202512191401_y25sx.mp4',
  '_26_log_202512191401_q6q8n.mp4',
  '_27_cpu_202512191401_rtzad.mp4',
  '_28_service_202512191401_vk61o.mp4',
  '_29_bandwidth_202512191401_ctv6k.mp4',
  '_30_incident_202512191401_071od.mp4',
  '_31_quantum_202512191401_jklu3.mp4',
  '_32_vpc_202512191401_km1y7.mp4',
  '_33_realtime_202512191402_2tg70.mp4',
  '_34_data_202512191402_4ou2r.mp4',
  '_35_network_202512191402_1quwz.mp4',
  '_36_storage_202512191402_kj5qs.mp4',
  '_37_autoscaling_202512191402_f2c7o.mp4',
  '_38_observability_202512191402_pet3k.mp4',
  '_39_power_202512191402_h6svy.mp4',
  '_40_anomaly_202512191402_wz49k.mp4',
  '_41_multicloud_202512191402_6kxp8.mp4',
  '_42_ssl_202512191402_cflj8.mp4',
  '_43_trace_202512191402_47bl1.mp4',
  '_44_network_202512191403_3xsod.mp4',
  '_45_sla_202512191403_5ayse.mp4',
  '_46_edge_202512191403_4lgb9.mp4',
  '_47_database_202512191403_2nu37.mp4',
  '_48_infrastructure_202512191403_tjfox.mp4',
  '_49_cost_202512191403_qskgl.mp4',
  '_50_secure_202512191403_y83x8.mp4',
];

/**
 * Fisher-Yates shuffle algorithm to randomize video order
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface UseVideoBackgroundReturn {
  /** Current video URL to display */
  currentVideo: string;
  /** Next video URL (for preloading) */
  nextVideo: string;
  /** Whether the video system is ready */
  isReady: boolean;
  /** Whether reduced motion is preferred */
  prefersReducedMotion: boolean;
  /** Trigger transition to next video */
  transitionToNext: () => void;
  /** Current video index for debugging */
  currentIndex: number;
}

/**
 * Custom hook for managing video background rotation with smooth transitions.
 * 
 * Features:
 * - Random video selection from available b-roll videos
 * - Preloading of next video for seamless transitions
 * - Respects prefers-reduced-motion accessibility setting
 * - Provides transition trigger for video end events
 */
export function useVideoBackground(): UseVideoBackgroundReturn {
  const [shuffledVideos, setShuffledVideos] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const preloadedVideosRef = useRef<Set<string>>(new Set());

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Initialize shuffled video list
  useEffect(() => {
    const shuffled = shuffleArray(VIDEO_FILES);
    setShuffledVideos(shuffled);
    setIsReady(true);
  }, []);

  // Get video URL from filename
  const getVideoUrl = useCallback((filename: string): string => {
    return `/videos/${filename}`;
  }, []);

  // Current and next video URLs
  const currentVideo = shuffledVideos.length > 0 
    ? getVideoUrl(shuffledVideos[currentIndex]) 
    : '';
  
  const nextIndex = (currentIndex + 1) % shuffledVideos.length;
  const nextVideo = shuffledVideos.length > 0 
    ? getVideoUrl(shuffledVideos[nextIndex]) 
    : '';

  // Preload next video
  useEffect(() => {
    if (!nextVideo || preloadedVideosRef.current.has(nextVideo)) return;

    const video = document.createElement('video');
    video.preload = 'auto';
    video.src = nextVideo;
    video.load();
    
    preloadedVideosRef.current.add(nextVideo);

    // Keep preload cache limited to prevent memory issues
    if (preloadedVideosRef.current.size > 5) {
      const iterator = preloadedVideosRef.current.values();
      const firstValue = iterator.next().value;
      if (firstValue) {
        preloadedVideosRef.current.delete(firstValue);
      }
    }
  }, [nextVideo]);

  // Transition to next video
  const transitionToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % shuffledVideos.length);
  }, [shuffledVideos.length]);

  return {
    currentVideo,
    nextVideo,
    isReady,
    prefersReducedMotion,
    transitionToNext,
    currentIndex,
  };
}

export default useVideoBackground;

