"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStartHandler = registerStartHandler;
const menus_1 = require("../menus");
const notifications_1 = require("../services/notifications");
const supabase_1 = require("../services/supabase");
function registerStartHandler(bot) {
    bot.start(async (ctx) => {
        const telegramUser = ctx.from;
        if (!telegramUser) {
            await ctx.reply('Unable to read your Telegram profile. Please try again.');
            return;
        }
        try {
            await (0, supabase_1.saveUser)({
                tg_id: telegramUser.id.toString(),
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name,
                username: telegramUser.username,
            });
        }
        catch (error) {
            console.error('Failed to save bot user', error);
        }
        const menu = (await (0, supabase_1.isAdmin)(telegramUser.id.toString())) ? menus_1.adminMenu : menus_1.userMenu;
        await ctx.reply([
            `Welcome to <b>TimTour</b>, ${telegramUser.first_name}!`,
            '',
            'Open the mini app, manage favorites, and stay close to new tours.',
        ].join('\n'), {
            ...menu,
            parse_mode: 'HTML',
        });
        await (0, notifications_1.notifyAdmin)(bot, [
            '<b>New /start in TimTour bot</b>',
            `User: ${telegramUser.first_name} ${telegramUser.last_name ?? ''}`.trim(),
            `Username: ${telegramUser.username ? `@${telegramUser.username}` : 'not set'}`,
            `TG ID: <code>${telegramUser.id}</code>`,
        ].join('\n'));
    });
}
