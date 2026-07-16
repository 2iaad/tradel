'use client';

import { useState } from 'react';

import { inputCls, labelCls } from '@/lib/ui';

// Labeled form input styled to the Carbon Terminal theme.
function Field({
    label,
    ...input
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <input {...input} className={inputCls} />
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
