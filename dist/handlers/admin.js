"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminHandlers = registerAdminHandlers;
const menus_1 = require("../menus");
const supabase_1 = require("../services/supabase");
async function ensureAdmin(ctx) {
    const tgId = ctx.from?.id?.toString();
    if (!tgId)
        return false;
    return (0, supabase_1.isAdmin)(tgId);
}
function registerAdminHandlers(bot) {
    bot.command('admin', async (ctx) => {
        if (!(await ensureAdmin(ctx))) {
            await ctx.reply('Admin access required.');
            return;
        }
        await ctx.reply('TimTour admin menu', menus_1.adminMenu);
    });
    bot.command('stats', async (ctx) => {
        if (!(await ensureAdmin(ctx))) {
            await ctx.reply('Admin access required.');
            return;
        }
        const usersCount = await (0, supabase_1.getBotUsersCount)();
        await ctx.reply([
            '<b>TimTour bot stats</b>',
            `Users: <b>${usersCount}</b>`,
        ].join('\n'), { parse_mode: 'HTML' });
    });
    bot.action('admin:stats', async (ctx) => {
        if (!(await ensureAdmin(ctx))) {
            await ctx.answerCbQuery('Admin only');
            return;
        }
        const usersCount = await (0, supabase_1.getBotUsersCount)();
        await ctx.answerCbQuery('Loaded');
        await ctx.reply(`Users in bot_users: ${usersCount}`);
    });
    bot.action('admin:broadcast-help', async (ctx) => {
        if (!(await ensureAdmin(ctx))) {
            await ctx.answerCbQuery('Admin only');
            return;
        }
        await ctx.answerCbQuery('Loaded');
        await ctx.reply('Use /broadcast Your message to send a broadcast to all bot users.');
    });
    bot.action('broadcast', async (ctx) => {
        if (!(await ensureAdmin(ctx))) {
            await ctx.answerCbQuery('Admin only');
            return;
        }
        await ctx.answerCbQuery('Loaded');
        await ctx.reply('Use /broadcast Your message to start a broadcast.');
    });
}
