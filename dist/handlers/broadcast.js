"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBroadcastHandlers = registerBroadcastHandlers;
const notifications_1 = require("../services/notifications");
const supabase_1 = require("../services/supabase");
function registerBroadcastHandlers(bot) {
    bot.command('broadcast', async (ctx) => {
        const tgId = ctx.from?.id?.toString();
        if (!tgId || !(await (0, supabase_1.isAdmin)(tgId))) {
            await ctx.reply('Admin access required.');
            return;
        }
        const text = ctx.message.text.replace('/broadcast', '').trim();
        if (!text) {
            await ctx.reply('Usage: /broadcast Your message');
            return;
        }
        await ctx.reply('Broadcast started...');
        const result = await (0, notifications_1.broadcastMessage)(bot, text);
        const summary = `Broadcast finished. Delivered: ${result.delivered}, failed: ${result.failed}.`;
        await ctx.reply(summary);
        await (0, notifications_1.notifyAdmin)(bot, `<b>Broadcast finished</b>\n${summary}`);
    });
}
