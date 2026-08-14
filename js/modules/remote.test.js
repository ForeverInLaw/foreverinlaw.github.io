import { test } from 'node:test';
import assert from 'node:assert/strict';

import { escapeHtml, safeUrl } from './remote.js';

test('escapeHtml neutralises markup and quotes', () => {
    assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    assert.equal(escapeHtml("O'Brien & co"), 'O&#39;Brien &amp; co');
    assert.equal(escapeHtml(null), '');
});

test('safeUrl passes http(s) only', () => {
    assert.equal(safeUrl('https://open.spotify.com/x'), 'https://open.spotify.com/x');
    assert.equal(safeUrl('  http://example.com  '), 'http://example.com');
    assert.equal(safeUrl('javascript:alert(1)'), '');
    assert.equal(safeUrl('data:text/html,<script>'), '');
    assert.equal(safeUrl('//evil.example.com'), '');
    assert.equal(safeUrl(undefined), '');
});
