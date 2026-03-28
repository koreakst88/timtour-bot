import { Context } from 'telegraf'
import { adminMenu } from '../menus'
import { getAllUsers, isAdmin } from '../services/supabase'
import type { TimTourBot } from '../types'

async function ensureAdmin(ctx: Context) {
  const tgId = ctx.from?.id?.toString()
  if (!tgId) return false

  return isAdmin(tgId)
}

export async function handleStats(ctx: Context) {
  const users = await getAllUsers()

  await ctx.reply(`
📊 Статистика TimTour

👥 Пользователей бота: ${users.length}
📋 Данные о заявках — смотри в панели управления

⚙️ Управление через панель администратора
  `)
}

export function registerAdminHandlers(bot: TimTourBot) {
  bot.command('admin', async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      await ctx.reply('Admin access required.')
      return
    }

    await ctx.reply('TimTour admin menu', adminMenu)
  })

  bot.command('stats', async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      await ctx.reply('Admin access required.')
      return
    }

    await handleStats(ctx)
  })

  bot.action('broadcast', async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      await ctx.answerCbQuery('Admin only')
      return
    }

    await ctx.answerCbQuery('Loaded')
    await ctx.reply('Используйте /broadcast Ваш текст для запуска рассылки.')
  })
}
