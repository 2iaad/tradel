'use client';

import { useState } from 'react';

import { Tape, TOP_TICKS, BOTTOM_TICKS } from '@/components/tape';
import { Mode } from '@/components/auth/common';
import { FormStrip } from '@/components/auth/form-strip';
import { HeroPanel } from '@/components/auth/hero-panel';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { ResetForm } from '@/components/auth/reset-form';

// Auth landing page: sliding login / register / reset panels between tapes.
export default function AuthPage() {
    const [mode, setMode] = useState<Mode>('login');

    return (
        <div className="relative w-full h-screen min-h-[640px] bg-[#0b0e10] overflow-hidden">
            <Tape
                items={TOP_TICKS}
                duration="46s"
                className="absolute top-0 left-0 right-0 h-11 border-b border-[#1b2226]"
            />
            {/* middle band holds the two sliding panels, between the tapes */}
            <div className="absolute top-[45px] bottom-[45px] left-0 right-0 overflow-hidden">
                <HeroPanel shifted={mode !== 'login'} />
                <FormStrip mode={mode}>
                    <LoginForm onSwitch={setMode} />
                    <RegisterForm onSwitch={setMode} />
                    <ResetForm onSwitch={setMode} />
                </FormStrip>
            </div>
            <Tape
                items={BOTTOM_TICKS}
                duration="58s"
                reverse
                className="absolute bottom-0 left-0 right-0 h-11 border-t border-[#1b2226]"
            />
        </div>
    );
}
