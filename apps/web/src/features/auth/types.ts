export type Session =
    | { status: 'checking'; email: null }
    | { status: 'anon'; email: null }
    | { status: 'error'; email: null; message: string }
    | { status: 'user'; id: string; email: string }
    | { status: 'demo'; email: string };
