import { Field } from '@/components/ui/field';

// The email input used identically by every auth form.
export function EmailField({ name = 'email' }: { name?: string }) {
    return (
        <Field
            label="Email"
            type="email"
            name={name}
            required
            maxLength={50}
            placeholder="you@example.com"
        />
    );
}
