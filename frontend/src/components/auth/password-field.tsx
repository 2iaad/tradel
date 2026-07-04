import { useState } from 'react';

import { Field } from '@/components/ui/field';

// Password input; strong mode adds the signup complexity constraints.
export function PasswordField({ strong = false }: { strong?: boolean }) {
    const [visible, setVisible] = useState(false);
    const rules = strong
        ? {
              minLength: 10,
              maxLength: 20,
              pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*',
              title: 'Must include a lowercase letter, an uppercase letter and a number',
              placeholder: '10+ characters',
          }
        : { placeholder: '••••••••' };
    return (
        <div className="relative">
            <Field
                label="Password"
                type={visible ? 'text' : 'password'}
                name="password"
                required
                {...rules}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute right-5 top-[40px] bg-transparent border-none p-0 text-[10.5px] font-mono tracking-[0.1em] text-[#5f6b70] cursor-pointer hover:text-[#93a09d]"
            >
                {visible ? 'HIDE' : 'SHOW'}
            </button>
        </div>
    );
}
