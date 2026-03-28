"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const telegraf_1 = require("telegraf");
const menus_1 = require("./menus");
const admin_1 = require("./handlers/admin");
const broadcast_1 = require("./handlers/broadcast");
const start_1 = require("./handlers/start");
const notifications_1 = require("./services/notifications");
const supabase_1 = require("./services/supabase");
const bot = new telegraf_1.Telegraf(supabase_1.env.BOT_TOKEN);
(0, start_1.registerStartHandler)(bot);
(0, admin_1.registerAdminHandlers)(bot);
(0, broadcast_1.registerBroadcastHandlers)(bot);
bot.use(async (ctx, next) => {
    const telegramUser = ctx.from;
    if (telegramUser) {
        try {
            await (0, supabase_1.upsertBotUser)({
                tg_id: telegramUser.id.toString(),
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name,
                username: telegramUser.username,
            });
            await (0, supabase_1.touchBotUser)(telegramUser.id.toString());
        }
        catch (error) {
            console.error('Failed to sync bot user', error);
        }
    }
    return next();
});
bot.action('menu:favorites', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Open TimTour and check your favorites there.', (0, menus_1.mainMenu)());
});
bot.action('menu:bookings', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Open TimTour and review your bookings in the mini app.', (0, menus_1.mainMenu)());
});
bot.action('menu:manager', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('A TimTour manager will contact you shortly.');
    await (0, notifications_1.notifyAdmin)(bot, `<b>Manager request</b>\nUser requested contact: <code>${ctx.from?.id ?? 'unknown'}</code>`);
});
bot.on('text', async (ctx) => {
    await ctx.reply('Use /start to open the menu or /admin if you are a manager.', (0, menus_1.mainMenu)());
});
bot.catch((error, ctx) => {
    console.error(`Bot error for update ${ctx.update.update_id}`, error);
});
bot.launch().then(() => {
    console.log('TimTour bot is running');
});
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
