// Non-standard attributes in the home markup that the animation script
// queries. Dashed custom attributes pass the JSX type check on their own;
// these dashless ones need declaring.
declare module 'react' {
    // React requires the same generic parameter in merged declarations.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface HTMLAttributes<T> {
        theme?: string;
        ratio?: string;
    }
}

export {};
