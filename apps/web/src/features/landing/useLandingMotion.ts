import { useEffect, useRef } from 'react';

/** One-shot reveals: no scroll handlers, no layout shifts, and no motion when requested. */
export function useLandingMotion() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | undefined;
    const targets = [
      ...root.querySelectorAll<HTMLElement>(
        '.hero-copy, .hero-collage, .business-types, .section-intro, .gallery-grid article, .feature-grid > div, .feature-grid > img, .workspace-feature > h2, .workspace-feature > p, .workspace-feature > div, .landing-footer > div',
      ),
    ];
    function setup() {
      observer?.disconnect();
      for (const target of targets) {
        target.removeAttribute('data-reveal');
        target.style.removeProperty('--reveal-delay');
      }
      if (preference.matches) return;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.setAttribute('data-reveal', 'visible');
            observer?.unobserve(entry.target);
          }
        },
        { threshold: 0.08 },
      );
      for (const target of targets) {
        const siblings = target.parentElement?.classList.contains('gallery-grid')
          ? [...target.parentElement.children].indexOf(target)
          : 0;
        target.style.setProperty('--reveal-delay', `${Math.min(siblings, 3) * 75}ms`);
        target.setAttribute('data-reveal', 'waiting');
        observer.observe(target);
      }
    }
    setup();
    preference.addEventListener('change', setup);
    return () => {
      observer?.disconnect();
      preference.removeEventListener('change', setup);
      targets.forEach((target) => target.removeAttribute('data-reveal'));
    };
  }, []);
  return ref;
}
