import { test } from 'node:test';
import assert from 'node:assert/strict';

import { placeNearPointer } from './pointer-follower.js';

const VIEWPORT = { width: 1000, height: 800 };
const SIZE = { width: 300, height: 200 };
const OFFSET = 20;

test('placeNearPointer sits below-right of the pointer when there is room', () => {
    assert.deepEqual(placeNearPointer({ x: 100, y: 100 }, SIZE, VIEWPORT, OFFSET), { x: 120, y: 120 });
});

test('placeNearPointer flips to the other side near an edge', () => {
    // 900 + 20 + 300 overruns the right limit (980), so it flips left of the pointer.
    const { x } = placeNearPointer({ x: 900, y: 100 }, SIZE, VIEWPORT, OFFSET);
    assert.equal(x, 900 - 300 - 20);

    const { y } = placeNearPointer({ x: 100, y: 750 }, SIZE, VIEWPORT, OFFSET);
    assert.equal(y, 750 - 200 - 20);
});

test('placeNearPointer keeps the box on screen when flipping is not enough', () => {
    // Flipping would put it at -20; the clamp pulls it back to the offset.
    assert.deepEqual(placeNearPointer({ x: 0, y: 0 }, { width: 990, height: 790 }, VIEWPORT, OFFSET), { x: 20, y: 20 });
});
