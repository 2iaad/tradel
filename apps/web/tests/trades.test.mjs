import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';

import { api } from '../src/lib/api.ts';
import { useAccountStore } from '../src/features/accounts/store.ts';
import { useSessionStore } from '../src/features/auth/store.ts';
import { useTradesStore } from '../src/features/trades/store.ts';

const accountOne = {
    id: 'account-one',
    name: 'Main',
    broker: null,
    currency: 'USD',
    starting_balance: '10000',
};
const accountTwo = { ...accountOne, id: 'account-two', name: 'Second' };
const tradeOne = {
    id: 'trade-one',
    account_id: accountOne.id,
    symbol: 'EURUSD',
    side: 'LONG',
    entry: '1.1',
    exit: '1.2',
    lots: '1',
    risk_reward: '2',
    pnl: '0.1',
    created_at: '2026-09-16T12:00:00.000Z',
};
const tradeTwo = {
    ...tradeOne,
    id: 'trade-two',
    symbol: 'GBPUSD',
    created_at: '2026-09-16T13:00:00.000Z',
};

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

function activate(account, owner = 'user-one') {
    useAccountStore.setState({
        accounts: [account],
        activeId: account.id,
        loadedFor: owner,
        loading: false,
    });
}

beforeEach(() => {
    globalThis.window = {
        localStorage: {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
        },
        sessionStorage: {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
        },
    };
    useSessionStore.setState(useSessionStore.getInitialState(), true);
    useAccountStore.setState(useAccountStore.getInitialState(), true);
    useTradesStore.setState(useTradesStore.getInitialState(), true);
    signIn();
});

afterEach(() => {
    mock.restoreAll();
    delete globalThis.window;
});

test('load deduplicates requests and keeps the loaded account cached', async () => {
    const response = deferred();
    const get = mock.method(api, 'get', () => response.promise);
    activate(accountOne);

    const load = useTradesStore.getState().load();
    assert.equal(get.mock.callCount(), 1);
    response.resolve({ data: [tradeOne] });
    await load;

    assert.deepEqual(useTradesStore.getState().trades, [tradeOne]);
    await useTradesStore.getState().load();
    assert.equal(get.mock.callCount(), 1);
});

test('an old account load cannot overwrite the selected account', async () => {
    const first = deferred();
    const second = deferred();
    const get = mock.method(api, 'get', (url) =>
        url.includes(accountOne.id) ? first.promise : second.promise,
    );
    activate(accountOne);
    activate(accountTwo);

    second.resolve({ data: [{ ...tradeTwo, account_id: accountTwo.id }] });
    await useTradesStore.getState().load();
    first.resolve({ data: [tradeOne] });
    await Promise.resolve();

    assert.equal(get.mock.callCount(), 2);
    assert.equal(useTradesStore.getState().trades[0].account_id, accountTwo.id);
});

test('create uses the POST response without reloading the trade list', async () => {
    const get = mock.method(api, 'get', async () => ({ data: [tradeOne] }));
    activate(accountOne);
    await useTradesStore.getState().load();
    const post = mock.method(api, 'post', async () => ({ data: tradeTwo }));
    const payload = { symbol: 'GBPUSD', side: 'LONG', entry: 1.1, exit: 1.2, lots: 1 };

    assert.equal(await useTradesStore.getState().create(payload), tradeTwo);

    assert.deepEqual(post.mock.calls[0].arguments, [`/accounts/${accountOne.id}/trades`, payload]);
    assert.deepEqual(useTradesStore.getState().trades, [tradeTwo, tradeOne]);
    assert.equal(get.mock.callCount(), 1);
});

test('update uses the PATCH response and can clear exit and risk reward', async () => {
    const get = mock.method(api, 'get', async () => ({ data: [tradeOne] }));
    activate(accountOne);
    await useTradesStore.getState().load();
    const updated = { ...tradeOne, exit: null, risk_reward: null, pnl: null };
    const patch = mock.method(api, 'patch', async () => ({ data: updated }));
    const payload = { exit: null, rReward: null };

    assert.equal(await useTradesStore.getState().update(tradeOne.id, payload), updated);

    assert.deepEqual(patch.mock.calls[0].arguments, [
        `/accounts/${accountOne.id}/trades/${tradeOne.id}`,
        payload,
    ]);
    assert.deepEqual(useTradesStore.getState().trades, [updated]);
    assert.equal(get.mock.callCount(), 1);
});

test('delete removes the trade without reloading the list', async () => {
    const get = mock.method(api, 'get', async () => ({ data: [tradeOne, tradeTwo] }));
    activate(accountOne);
    await useTradesStore.getState().load();
    const remove = mock.method(api, 'delete', async () => ({}));

    await useTradesStore.getState().remove(tradeOne.id);

    assert.deepEqual(remove.mock.calls[0].arguments, [
        `/accounts/${accountOne.id}/trades/${tradeOne.id}`,
    ]);
    assert.deepEqual(useTradesStore.getState().trades, [tradeTwo]);
    assert.equal(get.mock.callCount(), 1);
});

test('an account switch prevents an older mutation from changing the new list', async () => {
    const get = mock.method(api, 'get', async (url) => ({
        data: url.includes(accountOne.id) ? [tradeOne] : [],
    }));
    activate(accountOne);
    await useTradesStore.getState().load();
    const response = deferred();
    mock.method(api, 'post', () => response.promise);
    const create = useTradesStore.getState().create({
        symbol: 'GBPUSD',
        side: 'LONG',
        entry: 1.1,
        lots: 1,
    });

    activate(accountTwo);
    await useTradesStore.getState().load();
    response.resolve({ data: tradeTwo });

    await assert.rejects(create, /account changed/i);
    assert.deepEqual(useTradesStore.getState().trades, []);
    assert.equal(get.mock.callCount(), 2);
});

test('failed and overlapping mutations preserve state and progress', async () => {
    mock.method(api, 'get', async () => ({ data: [tradeOne] }));
    activate(accountOne);
    await useTradesStore.getState().load();
    const response = deferred();
    mock.method(api, 'patch', () => response.promise);
    const update = useTradesStore.getState().update(tradeOne.id, { symbol: 'UPDATED' });

    await assert.rejects(useTradesStore.getState().remove(tradeOne.id), /Please wait/);
    assert.deepEqual(useTradesStore.getState().pendingMutation, {
        type: 'update',
        id: tradeOne.id,
    });
    response.reject(new Error('Update failed'));
    await assert.rejects(update, /Update failed/);

    assert.deepEqual(useTradesStore.getState().trades, [tradeOne]);
    assert.equal(useTradesStore.getState().pendingMutation, null);
});

test('load failure is stored and can be retried', async () => {
    const get = mock.method(api, 'get', async () => {
        throw new Error('Offline');
    });
    activate(accountOne);
    await useTradesStore.getState().load();
    assert.equal(useTradesStore.getState().loadError, 'Offline');
    assert.equal(useTradesStore.getState().loading, false);

    get.mock.mockImplementation(async () => ({ data: [tradeOne] }));
    await useTradesStore.getState().load();
    assert.equal(useTradesStore.getState().loadError, null);
    assert.deepEqual(useTradesStore.getState().trades, [tradeOne]);
});

test('demo mutations survive repeated loads and can reopen a trade', async () => {
    useSessionStore.getState().startDemo();
    const get = mock.method(api, 'get', async () => {
        throw new Error('Unexpected request');
    });
    const post = mock.method(api, 'post', async () => {
        throw new Error('Unexpected request');
    });
    activate({ ...accountOne, id: 'demo-account-main' }, 'demo');
    await useTradesStore.getState().load();
    const created = await useTradesStore.getState().create({
        symbol: 'EURUSD',
        side: 'LONG',
        entry: 1.1,
        exit: 1.2,
        lots: 1,
    });
    const updated = await useTradesStore
        .getState()
        .update(created.id, { exit: null, rReward: null });
    await useTradesStore.getState().load();

    assert.equal(updated.exit, null);
    assert.equal(updated.risk_reward, null);
    assert.equal(updated.pnl, null);
    assert.equal(useTradesStore.getState().trades[0].id, created.id);
    assert.equal(get.mock.callCount(), 0);
    assert.equal(post.mock.callCount(), 0);
});
