"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
exports.notifyBookingConfirmed = notifyBookingConfirmed;
exports.notifyBookingRejected = notifyBookingRejected;
const supabase_1 = require("./supabase");
// Keeps the initialized client referenced in this module for future notification-related queries.
void supabase_1.supabase;
async function sendNotification(bot, tgId, message) {
    try {
        await bot.telegram.sendMessage(tgId, message);
    }
    catch (error) {
        console.error('Notification error:', error);
    }
}
async function notifyBookingConfirmed(bot, tgId, userName, tourTitle, travelDate) {
    const message = `
✅ ${userName}, ваша заявка подтверждена!

✈️ Тур: ${tourTitle}
📅 Дата: ${travelDate}

Менеджер свяжется с вами для уточнения деталей.
По вопросам: @TimTour_WW
  `;
    await sendNotification(bot, tgId, message);
}
async function notifyBookingRejected(bot, tgId, userName) {
    const message = `
❌ ${userName}, к сожалению тур недоступен.

Мы предложим вам альтернативный вариант.
Свяжитесь с менеджером: @TimTour_WW
  `;
    await sendNotification(bot, tgId, message);
}
