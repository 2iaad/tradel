import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';

import { api } from '../src/lib/api.ts';
import { hasDashboardSession, useSessionStore } from '../src/features/auth/store.ts';

beforeEach(() => {
    const storage = new Map();
    globalThis.window = {
        sessionStorage: {
            getItem: (key) => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value),
            removeItem: (key) => storage.delete(key),
        },
    };
    useSessionStore.setState({
        session: { status: 'checking', email: null },
        restoring: false,
        pendingAction: null,
    });
});

afterEach(() => {
    mock.restoreAll();
    delete globalThis.window;
});

test('restoring a session deduplicates requests and records the user', async () => {
    let resolve;
    const response = new Promise((done) => {
        resolve = done;
    });
    const get = mock.method(api, 'get', () => response);
    const first = useSessionStore.getState().restore();
    assert.equal(useSessionStore.getState().restore(), first);
    resolve({ data: { id: 'user-one', email: 'one@example.com' } });
    await first;
    assert.equal(get.mock.callCount(), 1);
    assert.equal(useSessionStore.getState().session.status, 'user');
    assert.equal(useSessionStore.getState().restoring, false);
});

test('an old restore cannot replace a demo session', async () => {
    let resolve;
    mock.method(
        api,
        'get',
        () =>
            new Promise((done) => {
                resolve = done;
            }),
    );
    const restore = useSessionStore.getState().restore();
    useSessionStore.getState().startDemo();
    resolve({ data: { id: 'user-one', email: 'one@example.com' } });
    await restore;
    assert.equal(useSessionStore.getState().session.status, 'demo');
});

test('a failed restore exposes the error and can be retried', async () => {
    const get = mock.method(api, 'get', async () => {
        throw new Error('Offline');
    });
    await assert.rejects(useSessionStore.getState().restore(), /Offline/);
    assert.equal(useSessionStore.getState().session.status, 'error');
    assert.equal(hasDashboardSession(useSessionStore.getState().session), false);
    get.mock.mockImplementation(async () => ({
        data: { id: 'user-one', email: 'one@example.com' },
    }));
    await useSessionStore.getState().restore();
    assert.equal(hasDashboardSession(useSessionStore.getState().session), true);
});

test('demo sign out clears local access without calling the API', async () => {
    const post = mock.method(api, 'post', async () => {
        throw new Error('Unexpected request');
    });
    useSessionStore.getState().startDemo();
    await useSessionStore.getState().signOut();
    assert.equal(useSessionStore.getState().session.status, 'anon');
    assert.equal(post.mock.callCount(), 0);
    assert.equal(window.sessionStorage.getItem('tradel.demoSession'), null);
});
