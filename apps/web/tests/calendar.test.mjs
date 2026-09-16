import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';

import { api } from '../src/lib/api.ts';
import { useAccountStore } from '../src/stores/accounts.ts';
import { useCalendarStore } from '../src/stores/calendar.ts';
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
    created_at: '2026-09-17T12:00:00.000Z',
};
const september = [
    {
        date: '2026-09-16',
        pnl: 100,
        trades: 1,
        items: [{ symbol: 'EURUSD', pnl: 100 }],
    },
];
const august = [
    {
        date: '2026-08-10',
        pnl: -50,
        trades: 1,
        items: [{ symbol: 'GBPUSD', pnl: -50 }],
    },
];

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
}

function calendarCalls(method) {
    return method.mock.calls.filter((call) => String(call.arguments[0]).includes('/calendar?'));
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
    useCalendarStore.setState(useCalendarStore.getInitialState(), true);
    signIn();
});

afterEach(() => {
    mock.restoreAll();
    delete globalThis.window;
});

test('an account change waits for the calendar page before loading', async () => {
    useCalendarStore.setState({ month: '2026-09' });
    const get = mock.method(api, 'get', async (url) => ({
        data: String(url).includes('/calendar?') ? september : [tradeOne],
    }));

    activate(accountOne);
    await Promise.resolve();
    assert.equal(calendarCalls(get).length, 0);

    await useCalendarStore.getState().load('2026-09');
    assert.equal(calendarCalls(get).length, 1);
});

test('load deduplicates and caches a calendar month', async () => {
    useCalendarStore.setState({ month: '2026-09' });
    const response = deferred();
    const get = mock.method(api, 'get', (url) =>
        String(url).includes('/calendar?')
            ? response.promise
            : Promise.resolve({ data: [tradeOne] }),
    );

    activate(accountOne);
    const firstLoad = useCalendarStore.getState().load('2026-09');
    const secondLoad = useCalendarStore.getState().load('2026-09');
    assert.equal(calendarCalls(get).length, 1);
    response.resolve({ data: september });
    await Promise.all([firstLoad, secondLoad]);

    await useCalendarStore.getState().load('2026-09');
    assert.deepEqual(useCalendarStore.getState().days, september);
    assert.equal(useCalendarStore.getState().loadedFor, 'user-one:account-one:2026-09');
    assert.equal(calendarCalls(get).length, 1);
});

test('a slower month cannot overwrite the latest selected month', async () => {
    useCalendarStore.setState({ month: '2026-08' });
    const first = deferred();
    const second = deferred();
    mock.method(api, 'get', (url) => {
        if (!String(url).includes('/calendar?')) return Promise.resolve({ data: [tradeOne] });
        return String(url).includes('2026-08') ? first.promise : second.promise;
    });

    activate(accountOne);
    const firstLoad = useCalendarStore.getState().load('2026-08');
    const secondLoad = useCalendarStore.getState().load('2026-09');
    second.resolve({ data: september });
    await secondLoad;
    first.resolve({ data: august });
    await firstLoad;

    assert.equal(useCalendarStore.getState().month, '2026-09');
    assert.deepEqual(useCalendarStore.getState().days, september);
});

test('an old account response cannot overwrite the selected account calendar', async () => {
    useCalendarStore.setState({ month: '2026-09' });
    const first = deferred();
    const second = deferred();
    mock.method(api, 'get', (url) => {
        if (!String(url).includes('/calendar?')) return Promise.resolve({ data: [] });
        return String(url).includes(accountOne.id) ? first.promise : second.promise;
    });

    activate(accountOne);
    const firstLoad = useCalendarStore.getState().load('2026-09');
    activate(accountTwo);
    const secondLoad = useCalendarStore.getState().load('2026-09');
    second.resolve({ data: august });
    await secondLoad;
    first.resolve({ data: september });
    await firstLoad;

    assert.deepEqual(useCalendarStore.getState().days, august);
    assert.equal(useCalendarStore.getState().loadedFor, 'user-one:account-two:2026-09');
});

test('a failed calendar load can be retried', async () => {
    useCalendarStore.setState({ month: '2026-09' });
    const get = mock.method(api, 'get', async (url) => {
        if (String(url).includes('/calendar?')) throw new Error('Offline');
        return { data: [tradeOne] };
    });
    activate(accountOne);
    await useCalendarStore.getState().load('2026-09');
    assert.equal(useCalendarStore.getState().loadError, 'Offline');
    assert.equal(useCalendarStore.getState().loading, false);

    get.mock.mockImplementation(async (url) => ({
        data: String(url).includes('/calendar?') ? september : [tradeOne],
    }));
    await useCalendarStore.getState().load('2026-09');

    assert.equal(useCalendarStore.getState().loadError, null);
    assert.deepEqual(useCalendarStore.getState().days, september);
});

test('a trade mutation marks the calendar stale until its next load', async () => {
    useCalendarStore.setState({ month: '2026-09' });
    const get = mock.method(api, 'get', async (url) => ({
        data: String(url).includes('/calendar?') ? september : [tradeOne],
    }));
    activate(accountOne);
    await Promise.all([
        useTradesStore.getState().load(),
        useCalendarStore.getState().load('2026-09'),
    ]);
    mock.method(api, 'post', async () => ({ data: tradeTwo }));

    await useTradesStore.getState().create({
        symbol: tradeTwo.symbol,
        side: tradeTwo.side,
        entry: Number(tradeTwo.entry),
        exit: Number(tradeTwo.exit),
        lots: Number(tradeTwo.lots),
    });

    assert.equal(useCalendarStore.getState().stale, true);
    assert.equal(calendarCalls(get).length, 1);
    await useCalendarStore.getState().load('2026-09');
    assert.equal(useCalendarStore.getState().stale, false);
    assert.equal(calendarCalls(get).length, 2);
});

test('demo calendar recomputes from local trades without API requests', async () => {
    useSessionStore.getState().startDemo();
    const get = mock.method(api, 'get', async () => {
        throw new Error('Unexpected request');
    });
    const post = mock.method(api, 'post', async () => {
        throw new Error('Unexpected request');
    });
    activate({ ...accountOne, id: 'demo-account-main' }, 'demo');
    await useTradesStore.getState().load();
    const trade = useTradesStore.getState().trades[0];
    const month = trade.created_at.slice(0, 7);
    await useCalendarStore.getState().load(month);
    const previousTrades = useCalendarStore
        .getState()
        .days.reduce((total, day) => total + day.trades, 0);

    await useTradesStore.getState().create({
        symbol: 'EURUSD',
        side: 'LONG',
        entry: 1.1,
        lots: 1,
    });
    await useCalendarStore.getState().load(month);
    const currentTrades = useCalendarStore
        .getState()
        .days.reduce((total, day) => total + day.trades, 0);

    assert.equal(currentTrades, previousTrades + 1);
    assert.equal(get.mock.callCount(), 0);
    assert.equal(post.mock.callCount(), 0);
});

test('calendar rejects invalid month values before making a request', async () => {
    const get = mock.method(api, 'get', async () => ({ data: [] }));

    await assert.rejects(useCalendarStore.getState().load('2026-13'), /YYYY-MM/);
    assert.equal(get.mock.callCount(), 0);
});
