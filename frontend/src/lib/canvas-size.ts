/* Cached canvas client sizes. Reading clientWidth/clientHeight inside a rAF
   draw loop forces synchronous layout whenever anything has dirtied it; a
   ResizeObserver delivers sizes after layout instead, so draw loops never
   trigger a reflow. First call reads once and observes from then on. */
const sizes = new WeakMap<Element, { w: number; h: number }>();
const ro =
    typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver((entries) => {
              for (const en of entries)
                  sizes.set(en.target, { w: en.contentRect.width, h: en.contentRect.height });
          });

// Client size of a draw target, without forcing layout after the first read.
export function clientSize(el: HTMLCanvasElement) {
    let s = sizes.get(el);
    if (!s) {
        s = { w: el.clientWidth, h: el.clientHeight };
        sizes.set(el, s);
        ro?.observe(el);
    }
    return s;
}
