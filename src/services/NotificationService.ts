import nodemailer from 'nodemailer';
import { WebClient } from '@slack/web-api';
import { logger } from '../utils/logger';

export interface NotificationConfig {
    email?: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
        from: string;
    };
    slack?: {
        token: string;
        defaultChannel: string;
    };
}

export interface Notification {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    metadata?: any;
    channel?: string;
    recipients?: string[];
}

export class NotificationService {
    private emailTransporter: nodemailer.Transporter | null = null;
    private slackClient: WebClient | null = null;
    private readonly config: NotificationConfig;

    constructor(config: NotificationConfig) {
        this.config = config;
        this.initialize();
    }

    private async initialize() {
        if (this.config.email) {
            this.emailTransporter = nodemailer.createTransport({
                host: this.config.email.host,
                port: this.config.email.port,
                secure: this.config.email.secure,
                auth: {
                    user: this.config.email.auth.user,
                    pass: this.config.email.auth.pass,
                },
            });
        }

        if (this.config.slack) {
            this.slackClient = new WebClient(this.config.slack.token);
        }
    }

    async sendNotification(notification: Notification): Promise<void> {
        try {
            await Promise.all([
                this.sendEmail(notification),
                this.sendSlack(notification),
            ]);
        } catch (error) {
            logger.error('Failed to send notification:', error);
            throw error;
        }
    }

    private async sendEmail(notification: Notification): Promise<void> {
        if (!this.emailTransporter || !this.config.email || !notification.recipients?.length) {
            return;
        }

        try {
            const emailContent = this.formatEmailContent(notification);
            await this.emailTransporter.sendMail({
                from: this.config.email.from,
                to: notification.recipients,
                subject: `[${notification.severity.toUpperCase()}] ${notification.title}`,
                html: emailContent,
            });

            logger.info('Email notification sent successfully', {
                title: notification.title,
                recipients: notification.recipients,
            });
        } catch (error) {
            logger.error('Failed to send email notification:', error);
            throw error;
        }
    }

    private async sendSlack(notification: Notification): Promise<void> {
        if (!this.slackClient || !this.config.slack) {
            return;
        }

        try {
            const channel = notification.channel || this.config.slack.defaultChannel;
            const blocks = this.formatSlackBlocks(notification);

            await this.slackClient.chat.postMessage({
                channel,
                blocks,
                text: notification.message, // Fallback text
            });

            logger.info('Slack notification sent successfully', {
                title: notification.title,
                channel,
            });
        } catch (error) {
            logger.error('Failed to send Slack notification:', error);
            throw error;
        }
    }

    private formatEmailContent(notification: Notification): string {
        const severityColors = {
            info: '#2196F3',
            warning: '#FFC107',
            error: '#F44336',
            critical: '#D32F2F',
        };

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: ${severityColors[notification.severity]}; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
                    <h2 style="margin: 0;">${notification.title}</h2>
                </div>
                <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
                    <p>${notification.message}</p>
                    ${notification.metadata ? `
                        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 15px;">
                            <pre style="margin: 0;">${JSON.stringify(notification.metadata, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    private formatSlackBlocks(notification: Notification): any[] {
        const severityEmoji = {
            info: ':information_source:',
            warning: ':warning:',
            error: ':x:',
            critical: ':rotating_light:',
        };

        const blocks: any[] = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${severityEmoji[notification.severity]} ${notification.title}`,
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: notification.message,
                },
            },
        ];

        if (notification.metadata) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: '```' + JSON.stringify(notification.metadata, null, 2) + '```',
                },
            });
        }

        return blocks;
    }

    async testConnections(): Promise<{
        email: boolean;
        slack: boolean;
    }> {
        const results = {
            email: false,
            slack: false,
        };

        if (this.emailTransporter) {
            try {
                await this.emailTransporter.verify();
                results.email = true;
            } catch (error) {
                logger.error('Email connection test failed:', error);
            }
        }

        if (this.slackClient) {
            try {
                await this.slackClient.auth.test();
                results.slack = true;
            } catch (error) {
                logger.error('Slack connection test failed:', error);
            }
        }

        return results;
    }
} 