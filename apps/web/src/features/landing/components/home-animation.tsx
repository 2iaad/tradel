'use client';

import { useEffect } from 'react';
import { setupProcessSequence, setupSupportSequence } from '../animations/frame-sequences';
import {
    setupEducationToggle,
    setupMarquees,
    setupResponsiveState,
    setupScrambleLinks,
    setupSeoShowMore,
    setupVisibilityObservers,
} from '../animations/interactions';
import { setupLighthouseStory } from '../animations/lighthouse';
import {
    destroySmoothScroll,
    prepareAnchors,
    setupNavigation,
    setupSmoothScroll,
} from '../animations/navigation';
import { gsap, ScrollTrigger } from '../animations/runtime';
import { setupSwipers } from '../animations/sliders';
import {
    revertSplitText,
    setupPixelScanners,
    setupSplitText,
    setupStaggeredTitles,
} from '../animations/text';

function initialize() {
    if (document.documentElement.classList.contains('tradel-initialized')) return;
    document.documentElement.classList.add('tradel-initialized');

    prepareAnchors();
    setupResponsiveState();
    setupSplitText();
    setupSmoothScroll();
    setupNavigation();
    setupPixelScanners();
    setupStaggeredTitles();
    setupLighthouseStory();
    setupProcessSequence();
    setupSupportSequence();
    setupSwipers();
    setupEducationToggle();
    setupMarquees();
    setupVisibilityObservers();
    setupScrambleLinks();
    setupSeoShowMore();

    document.documentElement.classList.add('js-ready');
    requestAnimationFrame(() => ScrollTrigger.refresh());
}

// Undo the global side effects initialize() sets up, so leaving the home page
// via client-side nav doesn't leave Lenis/ScrollTrigger transforms bleeding
// onto /login and /register (which only cleared on a hard refresh before).
function teardown() {
    destroySmoothScroll();
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    gsap.globalTimeline.clear();
    // Revert SplitText so the line-wrapping <div>s and their leftover GSAP
    // transforms don't survive the unmount and bleed onto the next page.
    revertSplitText();
    document.documentElement.classList.remove('tradel-initialized', 'js-ready');
}

// Runs the animation setup on mount, tears it down on unmount so it re-inits
// cleanly when the user returns to the home page.
export function HomeAnimation() {
    useEffect(() => {
        initialize();
        return teardown;
    }, []);
    return null;
}
