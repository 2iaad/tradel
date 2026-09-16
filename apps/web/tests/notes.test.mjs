import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';

import { api } from '../src/lib/api.ts';
import { useAccountStore } from '../src/stores/accounts.ts';
import { useNotesStore } from '../src/stores/notes.ts';
import { useSessionStore } from '../src/stores/session.ts';
import { useTradesStore } from '../src/stores/trades.ts';

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
const noteOne = {
    id: 'note-one',
    account_id: accountOne.id,
    trade_id: tradeOne.id,
    title: 'Good entry',
    body: 'Waited for confirmation.',
    tags: ['DISCIPLINE'],
    created_at: '2026-09-16T12:30:00.000Z',
};
const noteTwo = {
    ...noteOne,
    id: 'note-two',
    title: 'Second note',
    created_at: '2026-09-16T13:30:00.000Z',
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

function noteCalls(method) {
    return method.mock.calls.filter((call) => String(call.arguments[0]).endsWith('/notes'));
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
    useNotesStore.setState(useNotesStore.getInitialState(), true);
    signIn();
});

afterEach(() => {
    mock.restoreAll();
    delete globalThis.window;
});

test('load deduplicates requests and caches notes for the active account', async () => {
    const response = deferred();
    const get = mock.method(api, 'get', (url) =>
        String(url).endsWith('/notes') ? response.promise : Promise.resolve({ data: [tradeOne] }),
    );

    activate(accountOne);
    const firstLoad = useNotesStore.getState().load();
    const secondLoad = useNotesStore.getState().load();
    assert.equal(noteCalls(get).length, 1);
    response.resolve({ data: [noteOne] });
    await Promise.all([firstLoad, secondLoad]);

    await useNotesStore.getState().load();
    assert.deepEqual(useNotesStore.getState().notes, [noteOne]);
    assert.equal(useNotesStore.getState().loadedFor, 'user-one:account-one');
    assert.equal(noteCalls(get).length, 1);
});

test('an old account load cannot overwrite notes from the selected account', async () => {
    const first = deferred();
    const second = deferred();
    const get = mock.method(api, 'get', (url) => {
        if (!String(url).endsWith('/notes')) return Promise.resolve({ data: [] });
        return String(url).includes(accountOne.id) ? first.promise : second.promise;
    });

    activate(accountOne);
    activate(accountTwo);
    second.resolve({ data: [{ ...noteTwo, account_id: accountTwo.id }] });
    await useNotesStore.getState().load();
    first.resolve({ data: [noteOne] });
    await Promise.resolve();

    assert.equal(noteCalls(get).length, 2);
    assert.equal(useNotesStore.getState().notes[0].account_id, accountTwo.id);
});

test('create uses the POST response without reloading notes', async () => {
    const get = mock.method(api, 'get', async (url) => ({
        data: String(url).endsWith('/notes') ? [noteOne] : [tradeOne],
    }));
    activate(accountOne);
    await useNotesStore.getState().load();
    const post = mock.method(api, 'post', async () => ({ data: noteTwo }));
    const payload = { title: noteTwo.title, body: noteTwo.body, tags: noteTwo.tags };

    assert.equal(await useNotesStore.getState().create(tradeOne.id, payload), noteTwo);

    assert.deepEqual(post.mock.calls[0].arguments, [
        `/accounts/${accountOne.id}/trades/${tradeOne.id}/notes`,
        payload,
    ]);
    assert.deepEqual(useNotesStore.getState().notes, [noteTwo, noteOne]);
    assert.equal(noteCalls(get).length, 1);
});

test('update uses the PATCH response without reloading notes', async () => {
    const get = mock.method(api, 'get', async (url) => ({
        data: String(url).endsWith('/notes') ? [noteOne] : [tradeOne],
    }));
    activate(accountOne);
    await useNotesStore.getState().load();
    const updated = { ...noteOne, title: 'Updated title', tags: [] };
    const patch = mock.method(api, 'patch', async () => ({ data: updated }));
    const payload = { title: updated.title, tags: [] };

    assert.equal(await useNotesStore.getState().update(noteOne.id, payload), updated);

    assert.deepEqual(patch.mock.calls[0].arguments, [
        `/accounts/${accountOne.id}/notes/${noteOne.id}`,
        payload,
    ]);
    assert.deepEqual(useNotesStore.getState().notes, [updated]);
    assert.equal(noteCalls(get).length, 1);
});

test('delete removes a note without reloading the list', async () => {
    const get = mock.method(api, 'get', async (url) => ({
        data: String(url).endsWith('/notes') ? [noteOne, noteTwo] : [tradeOne],
    }));
    activate(accountOne);
    await useNotesStore.getState().load();
    const remove = mock.method(api, 'delete', async () => ({}));

    await useNotesStore.getState().remove(noteOne.id);

    assert.deepEqual(remove.mock.calls[0].arguments, [
        `/accounts/${accountOne.id}/notes/${noteOne.id}`,
    ]);
    assert.deepEqual(useNotesStore.getState().notes, [noteTwo]);
    assert.equal(noteCalls(get).length, 1);
});

test('deleting a trade removes its linked notes from the cache', async () => {
    mock.method(api, 'get', async (url) => ({
        data: String(url).endsWith('/notes') ? [noteOne] : [tradeOne],
    }));
    activate(accountOne);
    await Promise.all([useTradesStore.getState().load(), useNotesStore.getState().load()]);
    mock.method(api, 'delete', async () => ({}));

    await useTradesStore.getState().remove(tradeOne.id);

    assert.deepEqual(useNotesStore.getState().notes, []);
});

test('an account switch prevents an older mutation from changing the new list', async () => {
    mock.method(api, 'get', async (url) => ({
        data:
            String(url).endsWith('/notes') && String(url).includes(accountOne.id) ? [noteOne] : [],
    }));
    activate(accountOne);
    await useNotesStore.getState().load();
    const response = deferred();
    mock.method(api, 'post', () => response.promise);
    const create = useNotesStore.getState().create(tradeOne.id, {
        title: noteTwo.title,
        body: noteTwo.body,
    });

    activate(accountTwo);
    await useNotesStore.getState().load();
    response.resolve({ data: noteTwo });

    await assert.rejects(create, /account changed/i);
    assert.deepEqual(useNotesStore.getState().notes, []);
});

test('failed and overlapping mutations preserve notes and progress', async () => {
    mock.method(api, 'get', async (url) => ({
        data: String(url).endsWith('/notes') ? [noteOne] : [tradeOne],
    }));
    activate(accountOne);
    await useNotesStore.getState().load();
    const response = deferred();
    mock.method(api, 'patch', () => response.promise);
    const update = useNotesStore.getState().update(noteOne.id, { title: 'Updated' });

    await assert.rejects(useNotesStore.getState().remove(noteOne.id), /Please wait/);
    assert.deepEqual(useNotesStore.getState().pendingMutation, {
        type: 'update',
        id: noteOne.id,
    });
    response.reject(new Error('Update failed'));
    await assert.rejects(update, /Update failed/);

    assert.deepEqual(useNotesStore.getState().notes, [noteOne]);
    assert.equal(useNotesStore.getState().pendingMutation, null);
});

test('load failure is stored and can be retried', async () => {
    const get = mock.method(api, 'get', async (url) => {
        if (String(url).endsWith('/notes')) throw new Error('Offline');
        return { data: [tradeOne] };
    });
    activate(accountOne);
    await useNotesStore.getState().load();
    assert.equal(useNotesStore.getState().loadError, 'Offline');
    assert.equal(useNotesStore.getState().loading, false);

    get.mock.mockImplementation(async (url) => ({
        data: String(url).endsWith('/notes') ? [noteOne] : [tradeOne],
    }));
    await useNotesStore.getState().load();
    assert.equal(useNotesStore.getState().loadError, null);
    assert.deepEqual(useNotesStore.getState().notes, [noteOne]);
});

test('demo note mutations survive repeated loads', async () => {
    useSessionStore.getState().startDemo();
    const get = mock.method(api, 'get', async () => {
        throw new Error('Unexpected request');
    });
    const post = mock.method(api, 'post', async () => {
        throw new Error('Unexpected request');
    });
    activate({ ...accountOne, id: 'demo-account-main' }, 'demo');
    await Promise.all([useTradesStore.getState().load(), useNotesStore.getState().load()]);
    const trade = useTradesStore.getState().trades[0];
    const created = await useNotesStore.getState().create(trade.id, {
        title: 'Demo note',
        body: 'Created locally.',
        tags: ['DEMO'],
    });
    const updated = await useNotesStore.getState().update(created.id, { tags: [] });

    await useNotesStore.getState().load();
    assert.deepEqual(updated.tags, []);
    assert.equal(useNotesStore.getState().notes[0].id, created.id);
    await useNotesStore.getState().remove(created.id);
    assert.equal(
        useNotesStore.getState().notes.some((note) => note.id === created.id),
        false,
    );
    assert.equal(get.mock.callCount(), 0);
    assert.equal(post.mock.callCount(), 0);
});
