'use client';

import { RangeKey } from './equity-chart.lib';
import { useEquityCanvas } from './use-equity-canvas';

export { RANGES } from './equity-chart.lib';
export type { RangeKey } from './equity-chart.lib';

// Canvas equity curve; ghost mode draws the dim dashed guest preview.
export function EquityChart({
    range = 'YTD',
    ghost = false,
}: {
    range?: RangeKey;
    ghost?: boolean;
}) {
    const canvasRef = useEquityCanvas(range, ghost);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-[340px] block ${ghost ? '' : 'cursor-crosshair'}`}
        />
    );
}
