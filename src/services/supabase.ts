import { createClient } from '@supabase/supabase-js'
import type { BotUser, TimTourEnv } from '../types'

const requiredEnv = ['BOT_TOKEN', 'ADMIN_TG_ID', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'TMA_URL'] as const

function readEnv(): TimTourEnv {
  const missing = requiredEnv.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }

  return {
    BOT_TOKEN: process.env.BOT_TOKEN!,
    ADMIN_TG_ID: process.env.ADMIN_TG_ID!,
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    TMA_URL: process.env.TMA_URL!,
  }
}

export const env = readEnv()

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

export async function upsertBotUser(user: {
  tg_id: string
  first_name?: string
  last_name?: string
  username?: string
}) {
  const payload = {
    tg_id: user.tg_id,
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    username: user.username ?? null,
    is_admin: user.tg_id === env.ADMIN_TG_ID,
    last_active: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('bot_users')
    .upsert(payload, { onConflict: 'tg_id' })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as BotUser
}

export async function touchBotUser(tgId: string) {
  const { error } = await supabase
    .from('bot_users')
    .update({ last_active: new Date().toISOString() })
    .eq('tg_id', tgId)

  if (error) {
    throw error
  }
}

export async function isAdmin(tgId: string) {
  if (tgId === env.ADMIN_TG_ID) return true

  const { data, error } = await supabase
    .from('bot_users')
    .select('is_admin')
    .eq('tg_id', tgId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return Boolean(data?.is_admin)
}

export async function getBotUsers() {
  const { data, error } = await supabase
    .from('bot_users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as BotUser[]
}

export async function getBotUsersCount() {
  const { count, error } = await supabase
    .from('bot_users')
    .select('*', { head: true, count: 'exact' })

  if (error) {
    throw error
  }

  return count ?? 0
}
