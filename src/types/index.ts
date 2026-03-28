import type { Context, Telegraf } from 'telegraf'

export type TimTourEnv = {
  BOT_TOKEN: string
  ADMIN_TG_ID: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  TMA_URL: string
}

export type BotUser = {
  id: string
  tg_id: string
  first_name: string | null
  last_name: string | null
  username: string | null
  is_admin: boolean
  created_at: string
  last_active: string
}

export type BroadcastResult = {
  delivered: number
  failed: number
}

export type TimTourBot = Telegraf<Context>
