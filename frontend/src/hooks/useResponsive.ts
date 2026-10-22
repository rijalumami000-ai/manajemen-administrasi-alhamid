import { useState, useEffect } from 'react';

// Breakpoints sesuai dengan variables.scss
export const BREAKPOINTS = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

export interface ScreenSize {
  width: number;
  height: number;
}

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  isXxl: boolean;
}

export interface ResponsiveReturn extends BreakpointState {
  screenSize: ScreenSize;
  breakpoints: typeof BREAKPOINTS;
}

export const useResponsive = (): ResponsiveReturn => {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const [breakpoint, setBreakpoint] = useState<BreakpointState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isXs: false,
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    isXxl: false,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({ width, height });

      setBreakpoint({
        // General categories
        isMobile: width < BREAKPOINTS.md,
        isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isDesktop: width >= BREAKPOINTS.lg,

        // Specific breakpoints
        isXs: width < BREAKPOINTS.xs,
        isSm: width >= BREAKPOINTS.xs && width < BREAKPOINTS.sm,
        isMd: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
        isLg: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isXl: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
        isXxl: width >= BREAKPOINTS.xl,
      });
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...breakpoint,
    screenSize,
    breakpoints: BREAKPOINTS,
  };
};

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
    // Legacy browsers
    else {
      (media as any).addListener(listener);
      return () => (media as any).removeListener(listener);
    }
  }, [matches, query]);

  return matches;
};

export interface OrientationState {
  isPortrait: boolean;
  isLandscape: boolean;
}

export const useOrientation = (): OrientationState => {
  const [orientation, setOrientation] = useState<OrientationState>({
    isPortrait: true,
    isLandscape: false,
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setOrientation({
        isPortrait,
        isLandscape: !isPortrait,
      });
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);

    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  return orientation;
};

export const useTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState<boolean>(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        ((navigator as any).msMaxTouchPoints > 0)
      );
    };

    checkTouch();
  }, []);

  return isTouch;
};

export default useResponsive;
