import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePostDate, toPostizApiType } from '../build/utils/post-status.js';

test('defaults undefined status to draft', () => {
    assert.equal(toPostizApiType(undefined), 'draft');
});

test('maps draft status to draft type', () => {
    assert.equal(toPostizApiType('draft'), 'draft');
});

test('maps scheduled status to schedule type', () => {
    assert.equal(toPostizApiType('scheduled'), 'schedule');
});

test('maps now status to now type', () => {
    assert.equal(toPostizApiType('now'), 'now');
});

test('resolvePostDate sets ISO date for drafts when omitted', () => {
    const result = resolvePostDate('draft');

    assert.ok(typeof result === 'string');
    assert.ok(!Number.isNaN(new Date(result).getTime()));
});

test('resolvePostDate preserves explicit date for drafts', () => {
    const draftDate = '2026-02-11T09:00:00+01:00';
    assert.equal(resolvePostDate('draft', draftDate), draftDate);
});

test('resolvePostDate preserves scheduled date', () => {
    const scheduledDate = '2026-02-11T10:30:00+01:00';
    assert.equal(resolvePostDate('schedule', scheduledDate), scheduledDate);
});

test('resolvePostDate sets ISO date for now', () => {
    const result = resolvePostDate('now');

    assert.ok(typeof result === 'string');
    assert.ok(!Number.isNaN(new Date(result).getTime()));
});
