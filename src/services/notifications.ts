import { Telegraf } from 'telegraf'
import { supabase } from './supabase'

// Keeps the initialized client referenced in this module for future notification-related queries.
void supabase

export async function sendNotification(
  bot: Telegraf,
  tgId: string,
  message: string,
) {
  try {
    await bot.telegram.sendMessage(tgId, message)
  } catch (error) {
    console.error('Notification error:', error)
  }
}

export async function notifyBookingConfirmed(
  bot: Telegraf,
  tgId: string,
  userName: string,
  tourTitle: string,
  travelDate: string,
) {
  const message = `
✅ ${userName}, ваша заявка подтверждена!

✈️ Тур: ${tourTitle}
📅 Дата: ${travelDate}

Менеджер свяжется с вами для уточнения деталей.
По вопросам: @TimTour_WW
  `

  await sendNotification(bot, tgId, message)
}

export async function notifyBookingRejected(
  bot: Telegraf,
  tgId: string,
  userName: string,
) {
  const message = `
❌ ${userName}, к сожалению тур недоступен.

Мы предложим вам альтернативный вариант.
Свяжитесь с менеджером: @TimTour_WW
  `

  await sendNotification(bot, tgId, message)
}
