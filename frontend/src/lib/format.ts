// Uppercase "WED · JUL 02 2026"-style stamp for dashboard headers.
export function dateStamp() {
    const d = new Date();
    const part = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', o).toUpperCase();
    return `${part({ weekday: 'short' })} · ${part({ month: 'short' })} ${part({ day: '2-digit' })} ${d.getFullYear()}`;
}

// Signed money string, e.g. 782.4 -> "+$782.40", -204 -> "-$204.00".
export function signedMoney(v: number): string {
    const abs = Math.abs(v).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return (v >= 0 ? "+$" : "-$") + abs;
}

// JWT payload is { sub, email } — base64url-decode the middle segment.
export function emailFromToken(token: string): string | null {
    try {
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(b64)).email ?? null;
    } catch {
        return null;
    }
}
