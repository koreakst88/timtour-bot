"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMenu = exports.userMenu = void 0;
const telegraf_1 = require("telegraf");
const TMA_URL = process.env.TMA_URL;
exports.userMenu = telegraf_1.Markup.inlineKeyboard([
    [telegraf_1.Markup.button.webApp('🗺️ Каталог туров', `${TMA_URL}/client`)],
    [telegraf_1.Markup.button.webApp('📋 Мои заявки', `${TMA_URL}/bookings`)],
    [telegraf_1.Markup.button.url('💬 Связаться с менеджером', 'https://t.me/TimTour_WW')],
]);
exports.adminMenu = telegraf_1.Markup.inlineKeyboard([
    [telegraf_1.Markup.button.webApp('🗺️ Открыть каталог', `${TMA_URL}/client`)],
    [telegraf_1.Markup.button.webApp('⚙️ Панель управления', `${TMA_URL}/admin`)],
    [telegraf_1.Markup.button.callback('📢 Рассылка', 'broadcast')],
]);
