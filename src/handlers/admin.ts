import type { Context } from 'telegraf'
import { adminMenu } from '../menus'
import { getBotUsersCount, isAdmin } from '../services/supabase'
import type { TimTourBot } from '../types'

async function ensureAdmin(ctx: Context) {
  const tgId = ctx.from?.id?.toString()
  if (!tgId) return false

  return isAdmin(tgId)
}

export function registerAdminHandlers(bot: TimTourBot) {
  bot.command('admin', async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      await ctx.reply('Admin access required.')
      return
    }

    await ctx.reply('TimTour admin menu', adminMenu())
  })

  bot.command('stats', async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      await ctx.reply('Admin access required.')
      return
    }

    const usersCount = await getBotUsersCount()
    await ctx.reply(
      [
        '<b>TimTour bot stats</b>',
        `Users: <b>${usersCount}</b>`,
      ].join('\n'),
      { parse_mode: 'HTML' },
    )
  })

  bot.action('admin:stats', async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      await ctx.answerCbQuery('Admin only')
      return
    }

    const usersCount = await getBotUsersCount()
    await ctx.answerCbQuery('Loaded')
    await ctx.reply(`Users in bot_users: ${usersCount}`)
  })

  bot.action('admin:broadcast-help', async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      await ctx.answerCbQuery('Admin only')
      return
    }

    await ctx.answerCbQuery('Loaded')
    await ctx.reply('Use /broadcast Your message to send a broadcast to all bot users.')
  })
}
