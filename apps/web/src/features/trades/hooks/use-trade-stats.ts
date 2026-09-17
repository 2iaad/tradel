'use client';

import { useAccountStore } from '@/features/accounts/store';
import { useTradesStore } from '@/features/trades/store';
import { useMemo } from 'react';
import { toTradeLogRow } from '../lib/trade-log-row';
import { computeTradeStats, type TradeStats } from '../lib/trade-stats';

// Stats over ALL trades of the active account — the same numbers on every
// page. Does not fetch; each page already loads the trades store once.
export function useTradeStats(): TradeStats {
    const apiTrades = useTradesStore((s) => s.trades);
    const accounts = useAccountStore((s) => s.accounts);
    const activeId = useAccountStore((s) => s.activeId);
    return useMemo(() => {
        const sb = parseFloat(accounts.find((a) => a.id === activeId)?.starting_balance ?? '0');
        return computeTradeStats(apiTrades.map(toTradeLogRow), sb);
    }, [apiTrades, accounts, activeId]);
}
