"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStart = handleStart;
exports.handleDeepLink = handleDeepLink;
exports.registerStartHandler = registerStartHandler;
const telegraf_1 = require("telegraf");
const menus_1 = require("../menus");
const supabase_1 = require("../services/supabase");
const WELCOME_TEXT = `
Добро пожаловать в TimTour! ✈️

Подберите тур в пару кликов — без долгих переписок и ожидания ответа менеджера.

Смотрите туры с фото и видео, выбирайте подходящий вариант и оставляйте заявку прямо в Telegram.

👇 Откройте каталог по кнопке ниже
`;
async function handleStart(ctx) {
    const user = ctx.from;
    await (0, supabase_1.saveUser)({
        tg_id: String(user.id),
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
    });
    const admin = await (0, supabase_1.isAdmin)(String(user.id));
    await ctx.reply(WELCOME_TEXT, admin ? menus_1.adminMenu : menus_1.userMenu);
}
async function handleDeepLink(ctx, startPayload) {
    const TMA_URL = process.env.TMA_URL;
    if (startPayload.startsWith('tour_')) {
        const tourId = startPayload.replace('tour_', '');
        await ctx.reply('Открываю тур для вас... ✈️', telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.webApp('🗺️ Смотреть тур', `${TMA_URL}/tour/${tourId}`)],
        ]));
    }
    else {
        await handleStart(ctx);
    }
}
function registerStartHandler(bot) {
    bot.start(async (ctx) => {
        const startPayload = 'startPayload' in ctx ? ctx.startPayload : undefined;
        if (startPayload) {
            await handleDeepLink(ctx, startPayload);
            return;
        }
        await handleStart(ctx);
    });
}
