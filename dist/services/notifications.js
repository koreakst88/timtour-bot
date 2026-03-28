"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyAdmin = notifyAdmin;
exports.notifyUser = notifyUser;
exports.broadcastMessage = broadcastMessage;
const supabase_1 = require("./supabase");
async function notifyAdmin(bot, message) {
    try {
        await bot.telegram.sendMessage(supabase_1.env.ADMIN_TG_ID, message, {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
        });
    }
    catch (error) {
        console.error('Failed to notify admin', error);
    }
}
async function notifyUser(ctx, message) {
    if (!ctx.chat?.id)
        return;
    await ctx.telegram.sendMessage(ctx.chat.id, message, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
    });
}
async function broadcastMessage(bot, message) {
    const users = await (0, supabase_1.getBotUsers)();
    let delivered = 0;
    let failed = 0;
    for (const user of users) {
        try {
            await bot.telegram.sendMessage(user.tg_id, message, {
                parse_mode: 'HTML',
                link_preview_options: { is_disabled: true },
            });
            delivered += 1;
        }
        catch (error) {
            failed += 1;
            console.error(`Failed to deliver broadcast to ${user.tg_id}`, error);
        }
    }
    return { delivered, failed };
}
