"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBroadcastInProgress = isBroadcastInProgress;
exports.handleBroadcast = handleBroadcast;
exports.handleTemplateSelect = handleTemplateSelect;
exports.handleBroadcastText = handleBroadcastText;
exports.sendBroadcast = sendBroadcast;
exports.cancelBroadcast = cancelBroadcast;
exports.registerBroadcastHandlers = registerBroadcastHandlers;
const telegraf_1 = require("telegraf");
const supabase_1 = require("../services/supabase");
const broadcastState = new Map();
const TEMPLATES = {
    hot: '🔥 Горящий тур\n📍 {направление}\n📅 {даты}\n💰 {цена}',
    weekend: '✈️ Тур выходного дня\n📍 {направление}',
    new: '🆕 Новый тур\n\n{название тура}',
    custom: '',
};
const FIELD_LABELS = {
    hot: [
        { key: 'направление', prompt: 'Введите направление:' },
        { key: 'даты', prompt: 'Введите даты:' },
        { key: 'цена', prompt: 'Введите цену:' },
    ],
    weekend: [{ key: 'направление', prompt: 'Введите направление:' }],
    new: [{ key: 'название тура', prompt: 'Введите название тура:' }],
    custom: [{ key: 'text', prompt: 'Введите текст рассылки:' }],
};
function isAdminUser(ctx) {
    const userId = ctx.from?.id?.toString();
    return Boolean(userId && (0, supabase_1.isAdmin)(userId));
}
function getState(userId) {
    return broadcastState.get(userId);
}
function setState(userId, state) {
    broadcastState.set(userId, state);
}
function clearState(userId) {
    broadcastState.delete(userId);
}
function getCurrentFieldIndex(state) {
    return state.step === 'field_1' ? 0 : state.step === 'field_2' ? 1 : 2;
}
function getNextStep(step) {
    if (step === 'field_1')
        return 'field_2';
    if (step === 'field_2')
        return 'field_3';
    return 'confirm';
}
function buildPreviewText(state) {
    if (state.template === 'custom') {
        return state.fields.text ?? '';
    }
    return TEMPLATES[state.template]
        .replace('{направление}', state.fields['направление'] ?? '')
        .replace('{даты}', state.fields['даты'] ?? '')
        .replace('{цена}', state.fields['цена'] ?? '')
        .replace('{название тура}', state.fields['название тура'] ?? '');
}
function getTemplateKeyboard() {
    return telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.callback('🔥 Горящий тур', 'tmpl_hot')],
        [telegraf_1.Markup.button.callback('✈️ Тур выходного дня', 'tmpl_weekend')],
        [telegraf_1.Markup.button.callback('🆕 Новый тур', 'tmpl_new')],
        [telegraf_1.Markup.button.callback('✏️ Свой текст', 'tmpl_custom')],
        [telegraf_1.Markup.button.callback('❌ Отмена', 'broadcast_cancel')],
    ]);
}
function getConfirmKeyboard() {
    return telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.callback('✅ Отправить', 'broadcast_confirm'),
            telegraf_1.Markup.button.callback('❌ Отмена', 'broadcast_cancel'),
        ],
    ]);
}
function isBroadcastInProgress(userId) {
    const state = getState(userId);
    return Boolean(state && state.step !== 'template');
}
async function handleBroadcast(ctx) {
    const userId = String(ctx.from.id);
    setState(userId, {
        step: 'template',
        template: 'custom',
        fields: {},
    });
    await ctx.reply('📢 Выберите шаблон рассылки:', getTemplateKeyboard());
}
async function handleTemplateSelect(ctx, template) {
    const userId = String(ctx.from.id);
    const selectedTemplate = template;
    const firstField = FIELD_LABELS[selectedTemplate]?.[0];
    setState(userId, {
        step: 'field_1',
        template: selectedTemplate,
        fields: {},
    });
    await ctx.reply(firstField?.prompt ?? 'Введите текст рассылки:');
}
async function handleBroadcastText(ctx, text) {
    const userId = String(ctx.from.id);
    const state = getState(userId);
    if (!state || state.step === 'template' || state.step === 'confirm')
        return false;
    const fieldIndex = getCurrentFieldIndex(state);
    const fieldConfig = FIELD_LABELS[state.template][fieldIndex];
    if (!fieldConfig)
        return false;
    const nextFields = {
        ...state.fields,
        [fieldConfig.key]: text,
    };
    const hasNextField = fieldIndex + 1 < FIELD_LABELS[state.template].length;
    const nextStep = getNextStep(state.step);
    if (hasNextField) {
        setState(userId, {
            ...state,
            step: nextStep,
            fields: nextFields,
        });
        await ctx.reply(FIELD_LABELS[state.template][fieldIndex + 1].prompt);
        return true;
    }
    const finalText = buildPreviewText({
        ...state,
        step: 'confirm',
        fields: nextFields,
    });
    setState(userId, {
        ...state,
        step: 'confirm',
        fields: nextFields,
    });
    await ctx.reply(`📋 Превью рассылки:\n\n${finalText}\n\nОтправить всем пользователям?`, getConfirmKeyboard());
    return true;
}
async function sendBroadcast(ctx, bot) {
    const userId = String(ctx.from.id);
    const state = getState(userId);
    if (!state)
        return;
    const finalText = buildPreviewText(state);
    if (!finalText)
        return;
    const users = await (0, supabase_1.getAllUsers)();
    let sent = 0;
    let failed = 0;
    await ctx.reply('📤 Отправляю рассылку...');
    for (const user of users) {
        try {
            await bot.telegram.sendMessage(user.tg_id, finalText, {
                link_preview_options: { is_disabled: true },
            });
            sent += 1;
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
        catch {
            failed += 1;
        }
    }
    clearState(userId);
    await ctx.reply(`✅ Рассылка завершена!\n\n📤 Отправлено: ${sent}\n❌ Не доставлено: ${failed}`);
}
async function cancelBroadcast(ctx) {
    const userId = String(ctx.from.id);
    clearState(userId);
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
