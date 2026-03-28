import 'dotenv/config'
import { Telegraf } from 'telegraf'
import { adminMenu, userMenu } from './menus'
import { registerAdminHandlers } from './handlers/admin'
import { registerBroadcastHandlers } from './handlers/broadcast'
import { registerStartHandler } from './handlers/start'
import { notifyAdmin } from './services/notifications'
import { isAdmin, saveUser, touchUser } from './services/supabase'

const bot = new Telegraf(process.env.BOT_TOKEN!)

registerStartHandler(bot)
registerAdminHandlers(bot)
registerBroadcastHandlers(bot)

bot.use(async (ctx, next) => {
  const telegramUser = ctx.from

  if (telegramUser) {
    try {
      await saveUser({
        tg_id: telegramUser.id.toString(),
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
      })
      await touchUser(telegramUser.id.toString())
    } catch (error) {
      console.error('Failed to sync bot user', error)
    }
  }

  return next()
})

bot.action('menu:favorites', async (ctx) => {
  await ctx.answerCbQuery()
  const menu = (await isAdmin(ctx.from?.id?.toString() ?? '')) ? adminMenu : userMenu
  await ctx.reply('Open TimTour and check your favorites there.', menu)
})

bot.action('menu:bookings', async (ctx) => {
  await ctx.answerCbQuery()
  const menu = (await isAdmin(ctx.from?.id?.toString() ?? '')) ? adminMenu : userMenu
  await ctx.reply('Open TimTour and review your bookings in the mini app.', menu)
})

bot.action('menu:manager', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.reply('A TimTour manager will contact you shortly.')
  await notifyAdmin(
    bot,
    `<b>Manager request</b>\nUser requested contact: <code>${ctx.from?.id ?? 'unknown'}</code>`,
  )
})

bot.on('text', async (ctx) => {
  const menu = (await isAdmin(ctx.from?.id?.toString() ?? '')) ? adminMenu : userMenu
  await ctx.reply('Use /start to open the menu or /admin if you are a manager.', menu)
})

bot.catch((error, ctx) => {
  console.error(`Bot error for update ${ctx.update.update_id}`, error)
})

bot.launch().then(() => {
  console.log('TimTour bot is running')
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
