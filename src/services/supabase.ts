import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
)

export async function saveUser(user: {
  tg_id: string
  first_name?: string
  last_name?: string
  username?: string
}) {
  await supabase
    .from('bot_users')
    .upsert(
      {
        tg_id: user.tg_id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        last_active: new Date().toISOString(),
      },
      { onConflict: 'tg_id' },
    )
}

export async function getAllUsers() {
  const { data } = await supabase
    .from('bot_users')
    .select('tg_id')

  return data ?? []
}

export async function getBotUsersCount() {
  const { count } = await supabase
    .from('bot_users')
    .select('*', { head: true, count: 'exact' })

  return count ?? 0
}

export async function touchUser(tgId: string) {
  await supabase
    .from('bot_users')
    .update({ last_active: new Date().toISOString() })
    .eq('tg_id', tgId)
}

export async function isAdmin(tg_id: string) {
  return tg_id === process.env.ADMIN_TG_ID
}
