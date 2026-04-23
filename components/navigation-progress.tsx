'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function getTargetUrl(value: string | URL | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value.toString(), window.location.href);
  } catch {
    return null;
  }
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(
    () => `${pathname ?? ''}?${searchParams?.toString() ?? ''}`,
    [pathname, searchParams]
  );

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const activeRef = useRef(false);
  const progressRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const resetTimeoutRef = useRef<number | null>(null);
  const startFrameRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (startFrameRef.current !== null) {
      window.cancelAnimationFrame(startFrameRef.current);
      startFrameRef.current = null;
    }

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (activeRef.current) {
      return;
    }

    activeRef.current = true;
    clearTimers();
    setVisible(true);
    progressRef.current = 10;
    setProgress(10);

    intervalRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 84) {
          return current;
        }

        const next = current + Math.max((88 - current) * 0.12, 0.9);
        const value = Math.min(next, 84);
        progressRef.current = value;
        return value;
      });
    }, 160);
  }, [clearTimers]);

  const scheduleStart = useCallback(() => {
    if (activeRef.current || startFrameRef.current !== null) {
      return;
    }

    startFrameRef.current = window.requestAnimationFrame(() => {
      startFrameRef.current = null;
      start();
    });
  }, [start]);

  const complete = useCallback(() => {
    if (!activeRef.current && progressRef.current === 0) {
      return;
    }

    activeRef.current = false;
    clearTimers();
    progressRef.current = 100;
    setProgress(100);

    resetTimeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      progressRef.current = 0;
      setProgress(0);
    }, 360);
  }, [clearTimers]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      complete();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
    // routeKey intentionally covers pathname and query changes
  }, [complete, routeKey]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.target && anchor.target !== '_self') {
        return;
      }

      if (anchor.hasAttribute('download')) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const url = getTargetUrl(anchor.href);
      if (!url || url.origin !== window.location.origin) {
        return;
      }

      const nextRoute = `${url.pathname}?${url.searchParams.toString()}`;
      if (nextRoute === routeKey) {
        return;
      }

      scheduleStart();
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function pushState(data, unused, url) {
      const targetUrl = getTargetUrl(url);
      if (targetUrl && targetUrl.origin === window.location.origin) {
        const nextRoute = `${targetUrl.pathname}?${targetUrl.searchParams.toString()}`;
        if (nextRoute !== routeKey) {
          scheduleStart();
        }
      }

      return originalPushState(data, unused, url);
    };

    window.history.replaceState = function replaceState(data, unused, url) {
      const targetUrl = getTargetUrl(url);
      if (targetUrl && targetUrl.origin === window.location.origin) {
        const nextRoute = `${targetUrl.pathname}?${targetUrl.searchParams.toString()}`;
        if (nextRoute !== routeKey) {
          scheduleStart();
        }
      }

      return originalReplaceState(data, unused, url);
    };

    const handlePopState = () => {
      scheduleStart();
    };

    document.addEventListener('click', handleDocumentClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('popstate', handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearTimers();
    };
  }, [routeKey, scheduleStart, clearTimers]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[140] h-1 overflow-hidden"
    >
      <div
        className="from-primary via-accent to-primary absolute inset-y-0 left-0 bg-gradient-to-r shadow-[0_0_18px_hsl(var(--accent)/0.45)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateX(-${100 - progress}%)`,
          width: '100%',
        }}
      />
    </div>
  );
}
