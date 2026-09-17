export interface Account {
    id: string;
    name: string;
    broker: string | null;
    currency: string;
    starting_balance: string;
}

export interface AccountPayload {
    name: string;
    broker?: string;
    currency?: string;
    startingBalance: number;
}
