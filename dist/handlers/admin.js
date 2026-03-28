"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStats = handleStats;
exports.registerAdminHandlers = registerAdminHandlers;
const menus_1 = require("../menus");
const supabase_1 = require("../services/supabase");
async function ensureAdmin(ctx) {
    const tgId = ctx.from?.id?.toString();
    if (!tgId)
        return false;
    return (0, supabase_1.isAdmin)(tgId);
}
async function handleStats(ctx) {
    const users = await (0, supabase_1.getAllUsers)();
    await ctx.reply(`
📊 Статистика TimTour

👥 Пользователей бота: ${users.length}
📋 Данные о заявках — смотри в панели управления

⚙️ Управление через панель администратора
  `);
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
        await handleStats(ctx);
    });
    bot.action('broadcast', async (ctx) => {
        if (!(await ensureAdmin(ctx))) {
            await ctx.answerCbQuery('Admin only');
            return;
        }
        await ctx.answerCbQuery('Loaded');
        await ctx.reply('Используйте /broadcast Ваш текст для запуска рассылки.');
    });
}
