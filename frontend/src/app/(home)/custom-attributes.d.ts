// Non-standard attributes in the home markup that the animation script
// queries. Dashed custom attributes pass the JSX type check on their own;
// these dashless ones need declaring.
declare module 'react' {
    interface HTMLAttributes<T> {
        theme?: string;
        ratio?: string;
    }
}

export {};
