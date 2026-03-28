"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBroadcastInProgress = isBroadcastInProgress;
exports.handleBroadcast = handleBroadcast;
exports.handleTemplateSelect = handleTemplateSelect;
exports.handleBroadcastText = handleBroadcastText;
exports.sendBroadcast = sendBroadcast;
exports.cancelBroadcast = cancelBroadcast;
exports.registerBroadcastHandlers = registerBroadcastHandlers;
const supabase_1 = require("../services/supabase");
const broadcastState = new Map();
const TEMPLATES = {
    hot: '🔥 Горящий тур\n📍 {направление}\n📅 {даты}\n💰 {цена}\n\n',
    weekend: '✈️ Тур выходного дня\n📍 {направление}\n\n',
    new: '🆕 Новый тур\n\n',
    custom: '',
};
function isBroadcastInProgress(userId) {
    const state = broadcastState.get(userId);
    return state?.step === 'text';
}
async function handleBroadcast(ctx) {
    const userId = String(ctx.from.id);
    broadcastState.set(userId, { step: 'template' });
    await ctx.reply('📢 Выберите шаблон рассылки:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔥 Горящий тур', callback_data: 'tmpl_hot' }],
                [{ text: '✈️ Тур выходного дня', callback_data: 'tmpl_weekend' }],
                [{ text: '🆕 Новый тур', callback_data: 'tmpl_new' }],
                [{ text: '✏️ Свой текст', callback_data: 'tmpl_custom' }],
                [{ text: '❌ Отмена', callback_data: 'broadcast_cancel' }],
            ],
        },
    });
}
async function handleTemplateSelect(ctx, template) {
    const userId = String(ctx.from.id);
    const templateText = TEMPLATES[template];
    broadcastState.set(userId, {
        step: 'text',
        template,
        text: templateText,
    });
    await ctx.reply(templateText
        ? `Шаблон выбран! Дополните текст или отправьте как есть:\n\n${templateText}`
        : 'Напишите текст рассылки:');
}
async function handleBroadcastText(ctx, text) {
    const userId = String(ctx.from.id);
    const state = broadcastState.get(userId);
    if (!state || state.step !== 'text')
        return false;
    const finalText = state.text
        ? state.text + text
        : text;
    broadcastState.set(userId, {
        ...state,
        step: 'confirm',
        text: finalText,
    });
    await ctx.reply(`📋 Превью рассылки:\n\n${finalText}\n\nОтправить всем пользователям?`, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Отправить', callback_data: 'broadcast_confirm' },
                    { text: '❌ Отмена', callback_data: 'broadcast_cancel' },
                ],
            ],
        },
    });
    return true;
}
async function sendBroadcast(ctx, bot) {
    const userId = String(ctx.from.id);
    const state = broadcastState.get(userId);
    if (!state?.text)
        return;
    const users = await (0, supabase_1.getAllUsers)();
    let sent = 0;
    let failed = 0;
    await ctx.reply('📤 Отправляю рассылку...');
    for (const user of users) {
        try {
            await bot.telegram.sendMessage(user.tg_id, state.text);
            sent += 1;
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
        catch {
            failed += 1;
        }
    }
    broadcastState.delete(userId);
    await ctx.reply(`✅ Рассылка завершена!\n\n📤 Отправлено: ${sent}\n❌ Не доставлено: ${failed}`);
}
async function cancelBroadcast(ctx) {
    const userId = String(ctx.from.id);
    broadcastState.delete(userId);
    await ctx.reply('Рассылка отменена.');
}
function registerBroadcastHandlers(bot) {
    bot.command('broadcast', async (ctx) => {
        const userId = String(ctx.from?.id ?? '');
        if (!userId || !(await (0, supabase_1.isAdmin)(userId))) {
            await ctx.reply('Admin access required.');
            return;
        }
        await handleBroadcast(ctx);
    });
    bot.action(/^tmpl_(.+)$/, async (ctx) => {
        const userId = String(ctx.from?.id ?? '');
        if (!userId || !(await (0, supabase_1.isAdmin)(userId))) {
            await ctx.answerCbQuery('Admin only');
            return;
        }
        const template = ctx.match[1];
        await ctx.answerCbQuery('Шаблон выбран');
        await handleTemplateSelect(ctx, template);
    });
    bot.action('broadcast_confirm', async (ctx) => {
        const userId = String(ctx.from?.id ?? '');
        if (!userId || !(await (0, supabase_1.isAdmin)(userId))) {
            await ctx.answerCbQuery('Admin only');
            return;
        }
        await ctx.answerCbQuery('Отправляю');
        await sendBroadcast(ctx, bot);
    });
    bot.action('broadcast_cancel', async (ctx) => {
        const userId = String(ctx.from?.id ?? '');
        if (!userId || !(await (0, supabase_1.isAdmin)(userId))) {
            await ctx.answerCbQuery('Admin only');
            return;
        }
        await ctx.answerCbQuery('Отменено');
        await cancelBroadcast(ctx);
    });
}
