import { test } from 'node:test';
import assert from 'node:assert/strict';

import { packColumns } from './masonry.js';

const GAP = 16;

test('packColumns fills the shortest column each time', () => {
    const { placements, height } = packColumns([100, 50, 50], 2);

    assert.deepEqual(placements, [
        { column: 0, top: 0 },
        { column: 1, top: 0 },
        // Column 1 is at 50+gap, column 0 at 100+gap — the third card goes right.
        { column: 1, top: 50 + GAP }
    ]);
    assert.equal(height, 50 + GAP + 50 + GAP);
});

test('packColumns handles a single column and an empty row', () => {
    const single = packColumns([30, 40], 1);
    assert.deepEqual(single.placements.map(p => p.top), [0, 30 + GAP]);

    assert.deepEqual(packColumns([], 3), { placements: [], height: 0 });
});
