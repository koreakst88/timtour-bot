import { Markup } from 'telegraf'

const TMA_URL = process.env.TMA_URL!

export const userMenu = Markup.inlineKeyboard([
  [Markup.button.webApp('🗺️ Каталог туров', `${TMA_URL}/client`)],
  [Markup.button.webApp('📋 Мои заявки', `${TMA_URL}/bookings`)],
  [Markup.button.url('💬 Связаться с менеджером', 'https://t.me/TimTour_WW')],
])

export const adminMenu = Markup.inlineKeyboard([
  [Markup.button.webApp('🗺️ Открыть каталог', `${TMA_URL}/client`)],
  [Markup.button.webApp('⚙️ Панель управления', `${TMA_URL}/admin`)],
  [Markup.button.callback('📢 Рассылка', 'broadcast')],
])
