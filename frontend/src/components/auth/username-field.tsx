import { Field } from '@/components/ui/field';

// The username input shared by the register form and signup modal.
export function UsernameField() {
    return (
        <Field
            label="Username"
            type="text"
            name="username"
            required
            minLength={3}
            maxLength={15}
            placeholder="alextrader"
        />
    );
}
