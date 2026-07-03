import { Field } from '@/components/ui/field';

// Password input; strong mode adds the signup complexity constraints.
export function PasswordField({ strong = false }: { strong?: boolean }) {
    const rules = strong
        ? {
              minLength: 10,
              maxLength: 20,
              pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*',
              title: 'Must include a lowercase letter, an uppercase letter and a number',
              placeholder: '10+ characters',
          }
        : { placeholder: '••••••••' };
    return <Field label="Password" type="password" name="password" required {...rules} />;
}
