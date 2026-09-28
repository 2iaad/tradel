import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { Env } from 'src/config/env.validation';

@Injectable()
export class EmailService {
    private readonly resend: Resend;
    private readonly from: string;

    constructor(private readonly config: ConfigService<Env>) {
        const apiKey = this.config.getOrThrow('resendApiKey', { infer: true });
        this.from = this.config.getOrThrow('resendFromEmail', { infer: true });
        this.resend = new Resend(apiKey);
    }

    async sendVerificationEmail(email: string, rawToken: string): Promise<void> {
        const webUrl = this.config.get('allowedOrigins', { infer: true });
        const link = webUrl + '/verify-email#token=' + encodeURIComponent(rawToken);
        const tokenHash = createHash('sha256').update(rawToken).digest('hex');

        const { error } = await this.resend.emails.send(
            {
                from: this.from,
                to: [email],
                subject: 'Verify your Tradel email',
                text:
                    'Verify your Tradel email by opening this link:\n\n' +
                    link +
                    '\n\nThis link expires in 30 minutes.',
                html:
                    '<h1>Verify your email</h1>' +
                    '<p>Confirm your Tradel account by opening the link below.</p>' +
                    '<p><a href="' +
                    link +
                    '">Verify email</a></p>' +
                    '<p>This link expires in 30 minutes.</p>',
            },
            {
                idempotencyKey: 'email-verification/' + tokenHash,
            },
        );

        if (error) {
            throw new Error('Resend could not send the verification email: ' + error.message);
        }
    }
}
