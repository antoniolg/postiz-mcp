import test from 'node:test';
import assert from 'node:assert/strict';

import { toImagePayload } from '../build/utils/image.js';

test('URL with https sets empty id and keeps URL as path', () => {
    const result = toImagePayload('https://cdn.example.com/image.jpg');
    assert.equal(result.id, '');
    assert.equal(result.path, 'https://cdn.example.com/image.jpg');
});

test('URL with http sets empty id and keeps URL as path', () => {
    const result = toImagePayload('http://localhost:3000/uploads/image.png');
    assert.equal(result.id, '');
    assert.equal(result.path, 'http://localhost:3000/uploads/image.png');
});

test('file ID without protocol sets id and keeps as path', () => {
    const result = toImagePayload('abc123-def456');
    assert.equal(result.id, 'abc123-def456');
    assert.equal(result.path, 'abc123-def456');
});

test('file ID with slashes is still treated as ID (not URL)', () => {
    const result = toImagePayload('uploads/2024/image.jpg');
    assert.equal(result.id, 'uploads/2024/image.jpg');
    assert.equal(result.path, 'uploads/2024/image.jpg');
});

test('empty string returns empty id and path', () => {
    const result = toImagePayload('');
    assert.equal(result.id, '');
    assert.equal(result.path, '');
});
