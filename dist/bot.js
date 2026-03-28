"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const telegraf_1 = require("telegraf");
const menus_1 = require("./menus");
const admin_1 = require("./handlers/admin");
const broadcast_1 = require("./handlers/broadcast");
const start_1 = require("./handlers/start");
const supabase_1 = require("./services/supabase");
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
(0, start_1.registerStartHandler)(bot);
(0, admin_1.registerAdminHandlers)(bot);
(0, broadcast_1.registerBroadcastHandlers)(bot);
bot.use(async (ctx, next) => {
    const telegramUser = ctx.from;
    if (telegramUser) {
        try {
            await (0, supabase_1.saveUser)({
                tg_id: telegramUser.id.toString(),
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name,
                username: telegramUser.username,
            });
            await (0, supabase_1.touchUser)(telegramUser.id.toString());
        }
        catch (error) {
            console.error('Failed to sync bot user', error);
        }
    }
    return next();
});
bot.on('text', async (ctx) => {
    const menu = (await (0, supabase_1.isAdmin)(ctx.from?.id?.toString() ?? '')) ? menus_1.adminMenu : menus_1.userMenu;
    await ctx.reply('Use /start to open the menu or /admin if you are a manager.', menu);
});
bot.catch((error, ctx) => {
    console.error(`Bot error for update ${ctx.update.update_id}`, error);
});
bot.launch().then(() => {
    console.log('TimTour bot is running');
});
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
