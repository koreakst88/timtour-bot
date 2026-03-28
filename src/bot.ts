import { Markup, Telegraf } from 'telegraf'
import * as dotenv from 'dotenv'
import * as cron from 'node-cron'
import { handleStart, handleDeepLink } from './handlers/start'
import { handleStats } from './handlers/admin'
import {
  handleBroadcast,
  handleTemplateSelect,
  handleBroadcastText,
  sendBroadcast,
  cancelBroadcast,
  isBroadcastInProgress,
} from './handlers/broadcast'
import { supabase, isAdmin } from './services/supabase'

dotenv.config()

const bot = new Telegraf(process.env.BOT_TOKEN!)

bot.use(async (ctx, next) => {
  if (ctx.from) {
    await import('./services/supabase').then(({ saveUser }) =>
      saveUser({
        tg_id: String(ctx.from!.id),
        first_name: ctx.from!.first_name,
        last_name: ctx.from!.last_name,
        username: ctx.from!.username,
      }),
    )
  }

  return next()
})

bot.start(async (ctx) => {
  const payload = 'startPayload' in ctx ? ctx.startPayload : undefined

  if (payload) {
    await handleDeepLink(ctx, payload)
  } else {
    await handleStart(ctx)
  }
})

bot.command('catalog', async (ctx) => {
  const TMA_URL = process.env.TMA_URL!
  await ctx.reply(
    '🗺️ Открываю каталог туров...',
    Markup.inlineKeyboard([
      [Markup.button.webApp('🗺️ Каталог туров', `${TMA_URL}/catalog`)],
    ]),
  )
})

bot.command('bookings', async (ctx) => {
  const TMA_URL = process.env.TMA_URL!
  await ctx.reply(
    '📋 Открываю ваши заявки...',
    Markup.inlineKeyboard([
      [Markup.button.webApp('📋 Мои заявки', `${TMA_URL}/bookings`)],
    ]),
  )
})

bot.command('help', async (ctx) => {
  await ctx.reply(`
❓ Помощь TimTour

🗺️ /catalog — Смотреть все туры
📋 /bookings — Ваши заявки
💬 Написать менеджеру: @TimTour_WW

По всем вопросам обращайтесь к менеджеру!
  `)
})

bot.command('admin', async (ctx) => {
  if (!(await isAdmin(String(ctx.from.id)))) return
  const TMA_URL = process.env.TMA_URL!
  await ctx.reply(
    '⚙️ Панель управления',
    Markup.inlineKeyboard([
      [Markup.button.webApp('⚙️ Открыть панель', `${TMA_URL}/admin`)],
    ]),
  )
})

bot.command('broadcast', async (ctx) => {
  if (!(await isAdmin(String(ctx.from.id)))) return
  await handleBroadcast(ctx)
})

bot.command('stats', async (ctx) => {
  if (!(await isAdmin(String(ctx.from.id)))) return
  await handleStats(ctx)
})

bot.on('callback_query', async (ctx) => {
  const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined
  const userId = String(ctx.from.id)
  const admin = await isAdmin(userId)

  if (!admin) {
    await ctx.answerCbQuery('Нет доступа')
    return
  }

  if (data === 'broadcast') {
    await handleBroadcast(ctx)
  } else if (typeof data === 'string' && data.startsWith('tmpl_')) {
    const template = data.replace('tmpl_', '')
    await handleTemplateSelect(ctx, template)
  } else if (data === 'broadcast_confirm') {
    await sendBroadcast(ctx, bot)
  } else if (data === 'broadcast_cancel') {
    await cancelBroadcast(ctx)
  }

  await ctx.answerCbQuery()
})

bot.on('text', async (ctx) => {
  const userId = String(ctx.from.id)
  const admin = await isAdmin(userId)

  if (admin && isBroadcastInProgress(userId)) {
    await handleBroadcastText(ctx, ctx.message.text)
  }
})

bot.on('channel_post', async (ctx) => {
  const post = ctx.channelPost
  const TMA_URL = process.env.TMA_URL!

  if ('text' in post || 'caption' in post) {
    const text = ('text' in post ? post.text : post.caption) ?? ''

    if (text.includes('#тур') || text.includes('#tour') || text.includes('#timtour')) {
      try {
        await ctx.telegram.editMessageReplyMarkup(
          ctx.chat.id,
          post.message_id,
          undefined,
          {
            inline_keyboard: [
              [
                {
                  text: '🗺️ Посмотреть тур',
                  web_app: { url: `${TMA_URL}/catalog` },
                },
              ],
              [
                {
                  text: '✈️ Оставить заявку',
                  web_app: { url: `${TMA_URL}/client` },
                },
              ],
            ],
          },
        )
      } catch (error) {
        console.error('Channel post error:', error)
      }
    }
  }
})

cron.schedule('0 10 * * *', async () => {
  console.log('Running reminder cron job...')

  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
  const dateStr = threeDaysFromNow.toISOString().split('T')[0]

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, tour:tours(title)')
    .eq('status', 'confirmed')
    .eq('travel_date', dateStr)

  if (!bookings?.length) return

  for (const booking of bookings) {
    try {
      await bot.telegram.sendMessage(
        booking.user_tg_id,
        `⏰ ${booking.user_name}, напоминаем!\n\n` +
          `Ваш тур начинается через 3 дня ✈️\n` +
          `🗺️ ${booking.tour?.title}\n` +
          `📅 ${booking.travel_date}\n\n` +
          `По вопросам: @TimTour_WW`,
      )
    } catch (error) {
      console.error('Reminder error:', error)
    }
  }
})

async function setupCommands() {
  try {
    await bot.telegram.setMyCommands(
      [
        { command: 'start', description: '🏠 Главное меню' },
        { command: 'catalog', description: '🗺️ Каталог туров' },
        { command: 'bookings', description: '📋 Мои заявки' },
        { command: 'help', description: '❓ Помощь' },
      ],
      {
        scope: { type: 'all_private_chats' },
      },
    )
    console.log('User commands set ✅')

    const adminTgId = process.env.ADMIN_TG_ID

    if (adminTgId) {
      await bot.telegram.setMyCommands(
        [
          { command: 'start', description: '🏠 Главное меню' },
          { command: 'admin', description: '⚙️ Панель управления' },
          { command: 'broadcast', description: '📢 Рассылка' },
          { command: 'stats', description: '📊 Статистика' },
          { command: 'catalog', description: '🗺️ Каталог туров' },
          { command: 'bookings', description: '📋 Мои заявки' },
        ],
        {
          scope: {
            type: 'chat',
            chat_id: Number(adminTgId),
          },
        },
      )
      console.log('Admin commands set ✅')
    }
  } catch (error) {
    console.error('Commands error:', error)
  }
}

async function main() {
  console.log('TimTour bot starting... 🚀')

  await setupCommands()

  bot.launch()
  console.log('TimTour bot started! 🚀')
}

main().catch((error) => {
  console.error('Failed to start bot', error)
  process.exit(1)
})

process.once('SIGUSR2', () => bot.stop('SIGUSR2'))
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
