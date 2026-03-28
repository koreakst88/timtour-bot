import { broadcastMessage, notifyAdmin } from '../services/notifications'
import { isAdmin } from '../services/supabase'
import type { TimTourBot } from '../types'

export function registerBroadcastHandlers(bot: TimTourBot) {
  bot.command('broadcast', async (ctx) => {
    const tgId = ctx.from?.id?.toString()

    if (!tgId || !(await isAdmin(tgId))) {
      await ctx.reply('Admin access required.')
      return
    }

    const text = ctx.message.text.replace('/broadcast', '').trim()

    if (!text) {
      await ctx.reply('Usage: /broadcast Your message')
      return
    }

    await ctx.reply('Broadcast started...')

    const result = await broadcastMessage(bot, text)

    const summary = `Broadcast finished. Delivered: ${result.delivered}, failed: ${result.failed}.`
    await ctx.reply(summary)
    await notifyAdmin(bot, `<b>Broadcast finished</b>\n${summary}`)
  })
}
