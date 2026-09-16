import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';

import { api } from '../src/lib/api.ts';
import { useAccountStore } from '../src/stores/accounts.ts';
import { useSessionStore } from '../src/stores/session.ts';

const accountOne = {
    id: 'account-one',
    name: 'Main',
    broker: null,
    currency: 'USD',
    starting_balance: '10000',
};
const accountTwo = {
    id: 'account-two',
    name: 'Challenge',
    broker: 'Broker',
    currency: 'EUR',
    starting_balance: '25000',
};
let storage;

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
}

function signIn(id = 'user-one') {
    useSessionStore.setState({
        session: { status: 'user', id, email: `${id}@example.com` },
    });
}

function setReady(accounts, activeId = accounts[0]?.id ?? null, owner = 'user-one') {
    useAccountStore.setState({ accounts, activeId, loadedFor: owner, loading: false });
}

beforeEach(() => {
    storage = new Map();
    globalThis.window = {
        localStorage: {
            getItem: (key) => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value),
            removeItem: (key) => storage.delete(key),
        },
        sessionStorage: {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
        },
    };
    useSessionStore.setState(useSessionStore.getInitialState(), true);
    useAccountStore.setState(useAccountStore.getInitialState(), true);
    signIn();
});

afterEach(() => {
    mock.restoreAll();
    delete globalThis.window;
});

test('load deduplicates requests and restores the active account per user', async () => {
    storage.set('tradel.activeAccount.user-one', accountTwo.id);
    const response = deferred();
    const get = mock.method(api, 'get', () => response.promise);

    const first = useAccountStore.getState().load();
    assert.equal(useAccountStore.getState().load(), first);
    response.resolve({ data: [accountOne, accountTwo] });
    await first;

    assert.equal(get.mock.callCount(), 1);
    assert.equal(useAccountStore.getState().activeId, accountTwo.id);
    assert.equal(useAccountStore.getState().loadedFor, 'user-one');
    await useAccountStore.getState().load();
    assert.equal(get.mock.callCount(), 2);
});

test('create uses the POST response without reloading every account', async () => {
    setReady([accountOne]);
    const created = { ...accountTwo, id: 'new-account' };
    const post = mock.method(api, 'post', async () => ({ data: created }));
    const get = mock.method(api, 'get', async () => {
        throw new Error('Unexpected request');
    });
    const payload = {
        name: created.name,
        broker: created.broker,
        currency: created.currency,
        startingBalance: Number(created.starting_balance),
    };

    assert.equal(await useAccountStore.getState().create(payload), created);
    assert.deepEqual(post.mock.calls[0].arguments, ['/accounts', payload]);
    assert.equal(get.mock.callCount(), 0);
    assert.equal(useAccountStore.getState().activeId, created.id);
    assert.equal(storage.get('tradel.activeAccount.user-one'), created.id);
});

test('update replaces the account from the PATCH response without a reload', async () => {
    setReady([accountOne]);
    const updated = { ...accountOne, name: 'Updated' };
    const patch = mock.method(api, 'patch', async () => ({ data: updated }));
    const get = mock.method(api, 'get', async () => {
        throw new Error('Unexpected request');
    });

    const result = await useAccountStore.getState().update(accountOne.id, { name: updated.name });

    assert.equal(result, updated);
    assert.deepEqual(patch.mock.calls[0].arguments, [
        `/accounts/${accountOne.id}`,
        { name: updated.name },
    ]);
    assert.deepEqual(useAccountStore.getState().accounts, [updated]);
    assert.equal(get.mock.callCount(), 0);
});

test('delete updates the local list and selects a fallback without reloading', async () => {
    setReady([accountOne, accountTwo]);
    const remove = mock.method(api, 'delete', async () => ({}));
    const get = mock.method(api, 'get', async () => {
        throw new Error('Unexpected request');
    });

    await useAccountStore.getState().remove(accountOne.id);

    assert.deepEqual(remove.mock.calls[0].arguments, [`/accounts/${accountOne.id}`]);
    assert.deepEqual(useAccountStore.getState().accounts, [accountTwo]);
    assert.equal(useAccountStore.getState().activeId, accountTwo.id);
    assert.equal(storage.get('tradel.activeAccount.user-one'), accountTwo.id);
    assert.equal(get.mock.callCount(), 0);
});

test('a mutation cannot start before the account list is ready', async () => {
    const loadResponse = deferred();
    mock.method(api, 'get', () => loadResponse.promise);
    mock.method(api, 'post', async () => ({ data: accountTwo }));

    const load = useAccountStore.getState().load();
    await assert.rejects(
        useAccountStore.getState().create({
            name: accountTwo.name,
            broker: accountTwo.broker,
            currency: accountTwo.currency,
            startingBalance: Number(accountTwo.starting_balance),
        }),
        /finish loading/,
    );
    loadResponse.resolve({ data: [accountOne] });
    await load;

    assert.deepEqual(useAccountStore.getState().accounts, [accountOne]);
});

test('a session change prevents an older mutation from changing the new user', async () => {
    setReady([accountOne]);
    const firstResponse = deferred();
    const secondResponse = deferred();
    const post = mock.method(api, 'post', () => firstResponse.promise);
    const payload = {
        name: accountTwo.name,
        currency: accountTwo.currency,
        startingBalance: Number(accountTwo.starting_balance),
    };
    const first = useAccountStore.getState().create(payload);

    signIn('user-two');
    setReady([], null, 'user-two');
    post.mock.mockImplementation(() => secondResponse.promise);
    const second = useAccountStore.getState().create(payload);
    firstResponse.resolve({ data: { ...accountTwo, id: 'old-user-account' } });
    await assert.rejects(first, /session changed/i);
    assert.deepEqual(useAccountStore.getState().pendingMutation, { type: 'create' });

    secondResponse.resolve({ data: { ...accountTwo, id: 'new-user-account' } });
    await second;
    assert.equal(useAccountStore.getState().accounts[0].id, 'new-user-account');
    assert.equal(useAccountStore.getState().pendingMutation, null);
});

test('a failed mutation preserves account state and clears its progress', async () => {
    setReady([accountOne]);
    mock.method(api, 'patch', async () => {
        throw new Error('Update failed');
    });

    await assert.rejects(
        useAccountStore.getState().update(accountOne.id, { name: 'Updated' }),
        /Update failed/,
    );

    assert.deepEqual(useAccountStore.getState().accounts, [accountOne]);
    assert.equal(useAccountStore.getState().pendingMutation, null);
});

test('overlapping account mutations are rejected', async () => {
    setReady([accountOne]);
    const response = deferred();
    mock.method(api, 'patch', () => response.promise);
    const first = useAccountStore.getState().update(accountOne.id, { name: 'Updated' });

    await assert.rejects(useAccountStore.getState().remove(accountOne.id), /Please wait/);
    assert.deepEqual(useAccountStore.getState().pendingMutation, {
        type: 'update',
        id: accountOne.id,
    });

    response.resolve({ data: { ...accountOne, name: 'Updated' } });
    await first;
});

test('account selection is isolated by user and rejects unknown ids', async () => {
    const get = mock.method(api, 'get', async () => ({ data: [accountOne, accountTwo] }));
    await useAccountStore.getState().load();
    useAccountStore.getState().setActive(accountTwo.id);
    useAccountStore.getState().setActive('missing');
    assert.equal(useAccountStore.getState().activeId, accountTwo.id);

    signIn('user-two');
    await useAccountStore.getState().load();
    assert.equal(useAccountStore.getState().activeId, accountOne.id);
    assert.equal(storage.get('tradel.activeAccount.user-one'), accountTwo.id);
    assert.equal(storage.get('tradel.activeAccount.user-two'), accountOne.id);
    assert.equal(get.mock.callCount(), 2);
});

test('load failure is stored and can be retried', async () => {
    const get = mock.method(api, 'get', async () => {
        throw new Error('Offline');
    });
    await useAccountStore.getState().load();
    assert.equal(useAccountStore.getState().loadError, 'Offline');
    assert.equal(useAccountStore.getState().loading, false);

    get.mock.mockImplementation(async () => ({ data: [accountOne] }));
    await useAccountStore.getState().load();
    assert.equal(useAccountStore.getState().loadError, null);
    assert.deepEqual(useAccountStore.getState().accounts, [accountOne]);
});

test('demo changes survive repeated loads and do not use the API', async () => {
    useSessionStore.getState().startDemo();
    const get = mock.method(api, 'get', async () => {
        throw new Error('Unexpected request');
    });
    const post = mock.method(api, 'post', async () => {
        throw new Error('Unexpected request');
    });
    await useAccountStore.getState().load();
    const created = await useAccountStore.getState().create({
        name: 'Demo Two',
        currency: 'USD',
        startingBalance: 5000,
    });
    await useAccountStore.getState().load();

    assert.equal(useAccountStore.getState().accounts.length, 2);
    assert.equal(useAccountStore.getState().activeId, created.id);
    assert.equal(get.mock.callCount(), 0);
    assert.equal(post.mock.callCount(), 0);
});

test('blocked local storage does not break loading or selection', async () => {
    Object.defineProperty(window, 'localStorage', {
        get() {
            throw new Error('Blocked');
        },
    });
    mock.method(api, 'get', async () => ({ data: [accountOne, accountTwo] }));

    await useAccountStore.getState().load();
    useAccountStore.getState().setActive(accountTwo.id);

    assert.equal(useAccountStore.getState().activeId, accountTwo.id);
});
