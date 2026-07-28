'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { inputCls, labelCls } from '@/lib/ui';

// Labeled form input styled to the Carbon Terminal theme.
function Field({
    label,
    className,
    ...input
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div>
            <Label className={labelCls}>{label}</Label>
            <Input {...input} className={`${inputCls} ${className ?? ''}`} />
        </div>
    );
}

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
            <Button
                type="button"
                onClick={() => setVisible((v) => !v)}
                variant="ghost"
                size="xs"
                className="absolute right-3 top-[37px] h-6 bg-transparent px-1.5 font-mono text-ui-xs tracking-[0.1em] text-content-faint hover:bg-transparent hover:text-content-muted"
            >
                {visible ? 'HIDE' : 'SHOW'}
            </Button>
        </div>
    );
}
