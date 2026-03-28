import type { Context } from 'telegraf'
import type { BroadcastResult, TimTourBot } from '../types'
import { env, getBotUsers } from './supabase'

export async function notifyAdmin(bot: TimTourBot, message: string) {
  try {
    await bot.telegram.sendMessage(env.ADMIN_TG_ID, message, {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    })
  } catch (error) {
    console.error('Failed to notify admin', error)
  }
}

export async function notifyUser(ctx: Context, message: string) {
  if (!ctx.chat?.id) return

  await ctx.telegram.sendMessage(ctx.chat.id, message, {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
  })
}

export async function broadcastMessage(bot: TimTourBot, message: string): Promise<BroadcastResult> {
  const users = await getBotUsers()
  let delivered = 0
  let failed = 0

  for (const user of users) {
    try {
      await bot.telegram.sendMessage(user.tg_id, message, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      })
      delivered += 1
    } catch (error) {
      failed += 1
      console.error(`Failed to deliver broadcast to ${user.tg_id}`, error)
    }
  }

  return { delivered, failed }
}
