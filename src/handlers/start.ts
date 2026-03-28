import { Context, Markup } from 'telegraf'
import * as dotenv from 'dotenv'
dotenv.config()
import { userMenu, adminMenu } from '../menus'
import { saveUser, isAdmin } from '../services/supabase'
import type { TimTourBot } from '../types'

const WELCOME_TEXT = `
Добро пожаловать в TimTour! ✈️

Подберите тур в пару кликов — без долгих переписок и ожидания ответа менеджера.

Смотрите туры с фото и видео, выбирайте подходящий вариант и оставляйте заявку прямо в Telegram.

👇 Откройте каталог по кнопке ниже
`

export async function handleStart(ctx: Context) {
  const user = ctx.from!

  await saveUser({
    tg_id: String(user.id),
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
  })

  const admin = await isAdmin(String(user.id))

  await ctx.reply(
    WELCOME_TEXT,
    admin ? adminMenu : userMenu,
  )
}

export async function handleDeepLink(
  ctx: Context,
  startPayload: string,
) {
  const TMA_URL = process.env.TMA_URL || 
    'https://timtour-tma.vercel.app'

  if (startPayload.startsWith('tour_')) {
    const tourId = startPayload.replace('tour_', '')

    await ctx.reply(
      'Открываю тур для вас... ✈️',
      Markup.inlineKeyboard([
        [Markup.button.webApp('🗺️ Смотреть тур', `${TMA_URL}/tour/${tourId}`)],
      ]),
    )
  } else {
    await handleStart(ctx)
  }
}

export function registerStartHandler(bot: TimTourBot) {
  bot.start(async (ctx) => {
    const startPayload = 'startPayload' in ctx ? ctx.startPayload : undefined

    if (startPayload) {
      await handleDeepLink(ctx, startPayload)
      return
    }

    await handleStart(ctx)
  })
}
