import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';

import { api } from '../src/lib/api.ts';
import { useAccountStore } from '../src/stores/accounts.ts';
import { useAnalyticsStore } from '../src/stores/analytics.ts';
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
    pnl: '100',
    created_at: '2026-09-16T12:00:00.000Z',
};
const tradeTwo = {
    ...tradeOne,
    id: 'trade-two',
    symbol: 'GBPUSD',
    pnl: null,
    exit: null,
    risk_reward: null,
};
const summaryOne = {
    closed: 1,
    open: 0,
    wins: 1,
    losses: 0,
    net: 100,
    winRate: 1,
    profitFactor: null,
    expectancy: 100,
    avgR: 2,
};
const symbolOne = [{ label: 'EURUSD', net: 100, wins: 1, count: 1, winRate: 1 }];
const sideOne = [{ label: 'LONG', net: 100, wins: 1, count: 1, winRate: 1 }];

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
}

function responseSet() {
    return {
        summary: deferred(),
        symbol: deferred(),
        side: deferred(),
    };
}

function resolveSet(set, summary = summaryOne) {
    set.summary.resolve({ data: summary });
    set.symbol.resolve({ data: symbolOne });
    set.side.resolve({ data: sideOne });
}

function responseFor(url, set) {
    if (url.endsWith('/summary')) return set.summary.promise;
    if (url.endsWith('by=symbol')) return set.symbol.promise;
    return set.side.promise;
}

function analyticsCalls(method) {
    return method.mock.calls.filter((call) => String(call.arguments[0]).includes('/analytics/'));
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
    useAnalyticsStore.setState(useAnalyticsStore.getInitialState(), true);
    signIn();
});

afterEach(() => {
    mock.restoreAll();
    delete globalThis.window;
});

test('an account change waits for the analytics page before loading', async () => {
    const get = mock.method(api, 'get', async (url) => {
        if (!String(url).includes('/analytics/')) return { data: [tradeOne] };
        if (String(url).endsWith('/summary')) return { data: summaryOne };
        if (String(url).endsWith('by=symbol')) return { data: symbolOne };
        return { data: sideOne };
    });

    activate(accountOne);
    await Promise.resolve();
    assert.equal(analyticsCalls(get).length, 0);

    await useAnalyticsStore.getState().load();
    assert.equal(analyticsCalls(get).length, 3);
});

test('load deduplicates the three analytics requests and caches their result', async () => {
    const responses = responseSet();
    const get = mock.method(api, 'get', (url) =>
        String(url).includes('/analytics/')
            ? responseFor(String(url), responses)
            : Promise.resolve({ data: [tradeOne] }),
    );

    activate(accountOne);
    const firstLoad = useAnalyticsStore.getState().load();
    const secondLoad = useAnalyticsStore.getState().load();
    assert.equal(analyticsCalls(get).length, 3);
    resolveSet(responses);
    await Promise.all([firstLoad, secondLoad]);

    await useAnalyticsStore.getState().load();
    assert.deepEqual(useAnalyticsStore.getState().summary, summaryOne);
    assert.deepEqual(useAnalyticsStore.getState().bySymbol, symbolOne);
    assert.equal(useAnalyticsStore.getState().loadedFor, 'user-one:account-one');
    assert.equal(analyticsCalls(get).length, 3);
});

test('an old account response cannot overwrite current analytics', async () => {
    const first = responseSet();
    const second = responseSet();
    const get = mock.method(api, 'get', (url) => {
        if (!String(url).includes('/analytics/')) return Promise.resolve({ data: [] });
        return responseFor(String(url), String(url).includes(accountOne.id) ? first : second);
    });

    activate(accountOne);
    const firstLoad = useAnalyticsStore.getState().load();
    activate(accountTwo);
    const secondLoad = useAnalyticsStore.getState().load();
    const secondSummary = { ...summaryOne, net: 250 };
    resolveSet(second, secondSummary);
    await secondLoad;
    resolveSet(first);
    await firstLoad;

    assert.equal(analyticsCalls(get).length, 6);
    assert.deepEqual(useAnalyticsStore.getState().summary, secondSummary);
    assert.equal(useAnalyticsStore.getState().loadedFor, 'user-one:account-two');
});

test('a failed analytics load can be retried', async () => {
    const get = mock.method(api, 'get', async (url) => {
        if (String(url).includes('/analytics/')) throw new Error('Offline');
        return { data: [tradeOne] };
    });
    activate(accountOne);
    await useAnalyticsStore.getState().load();
    assert.equal(useAnalyticsStore.getState().loadError, 'Offline');
    assert.equal(useAnalyticsStore.getState().loading, false);

    get.mock.mockImplementation(async (url) => {
        const value = String(url);
        if (!value.includes('/analytics/')) return { data: [tradeOne] };
        if (value.endsWith('/summary')) return { data: summaryOne };
        if (value.endsWith('by=symbol')) return { data: symbolOne };
        return { data: sideOne };
    });
    await useAnalyticsStore.getState().load();

    assert.equal(useAnalyticsStore.getState().loadError, null);
    assert.deepEqual(useAnalyticsStore.getState().summary, summaryOne);
});

test('a trade mutation marks cached analytics stale until the next load', async () => {
    const get = mock.method(api, 'get', async (url) => {
        const value = String(url);
        if (!value.includes('/analytics/')) return { data: [tradeOne] };
        if (value.endsWith('/summary')) return { data: summaryOne };
        if (value.endsWith('by=symbol')) return { data: symbolOne };
        return { data: sideOne };
    });
    activate(accountOne);
    await Promise.all([useTradesStore.getState().load(), useAnalyticsStore.getState().load()]);
    mock.method(api, 'post', async () => ({ data: tradeTwo }));

    await useTradesStore.getState().create({
        symbol: tradeTwo.symbol,
        side: tradeTwo.side,
        entry: Number(tradeTwo.entry),
        lots: Number(tradeTwo.lots),
    });

    assert.equal(useAnalyticsStore.getState().stale, true);
    assert.equal(analyticsCalls(get).length, 3);
    await useAnalyticsStore.getState().load();
    assert.equal(useAnalyticsStore.getState().stale, false);
    assert.equal(analyticsCalls(get).length, 6);
});

test('demo analytics recompute from local trades without API requests', async () => {
    useSessionStore.getState().startDemo();
    const get = mock.method(api, 'get', async () => {
        throw new Error('Unexpected request');
    });
    const post = mock.method(api, 'post', async () => {
        throw new Error('Unexpected request');
    });
    activate({ ...accountOne, id: 'demo-account-main' }, 'demo');
    await Promise.all([useTradesStore.getState().load(), useAnalyticsStore.getState().load()]);
    const previousOpen = useAnalyticsStore.getState().summary.open;

    await useTradesStore.getState().create({
        symbol: 'EURUSD',
        side: 'LONG',
        entry: 1.1,
        lots: 1,
    });
    assert.equal(useAnalyticsStore.getState().stale, true);
    await useAnalyticsStore.getState().load();

    assert.equal(useAnalyticsStore.getState().summary.open, previousOpen + 1);
    assert.equal(get.mock.callCount(), 0);
    assert.equal(post.mock.callCount(), 0);
});
