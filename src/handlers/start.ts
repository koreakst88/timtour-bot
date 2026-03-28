import type { Context } from 'telegraf'
import { mainMenu } from '../menus'
import { notifyAdmin } from '../services/notifications'
import { upsertBotUser } from '../services/supabase'
import type { TimTourBot } from '../types'

export function registerStartHandler(bot: TimTourBot) {
  bot.start(async (ctx: Context) => {
    const telegramUser = ctx.from

    if (!telegramUser) {
      await ctx.reply('Unable to read your Telegram profile. Please try again.')
      return
    }

    try {
      await upsertBotUser({
        tg_id: telegramUser.id.toString(),
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
      })
    } catch (error) {
      console.error('Failed to save bot user', error)
    }

    await ctx.reply(
      [
        `Welcome to <b>TimTour</b>, ${telegramUser.first_name}!`,
        '',
        'Open the mini app, manage favorites, and stay close to new tours.',
      ].join('\n'),
      {
        ...mainMenu(),
        parse_mode: 'HTML',
      },
    )

    await notifyAdmin(
      bot,
      [
        '<b>New /start in TimTour bot</b>',
        `User: ${telegramUser.first_name} ${telegramUser.last_name ?? ''}`.trim(),
        `Username: ${telegramUser.username ? `@${telegramUser.username}` : 'not set'}`,
        `TG ID: <code>${telegramUser.id}</code>`,
      ].join('\n'),
    )
  })
}
