import { test } from 'node:test';
import assert from 'node:assert/strict';

import { interpolateColor } from './hero-title.js';

test('interpolateColor blends per channel', () => {
    assert.equal(interpolateColor('#000000', '#ffffff', 0), '#000000');
    assert.equal(interpolateColor('#000000', '#ffffff', 1), '#ffffff');
    assert.equal(interpolateColor('#000000', '#ffffff', 0.5), '#808080');
    // Channels move independently, and low bytes keep their leading zero.
    assert.equal(interpolateColor('#ff0000', '#0000ff', 0.5), '#800080');
    assert.equal(interpolateColor('#000000', '#0000ff', 0.5), '#000080');
});
