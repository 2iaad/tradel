import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, SplitText, CustomEase);
CustomEase.create('main', '0.5, 0.05, 0.05, 0.99');

const SYMBOLS = '$€£¢¥%→↑↓←↙↖↗↘';

export { gsap, ScrollTrigger, SplitText, SYMBOLS };
