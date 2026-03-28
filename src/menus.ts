import { Markup } from 'telegraf'
import { env } from './services/supabase'

export function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.webApp('Open TimTour', env.TMA_URL)],
    [
      Markup.button.callback('Favorites', 'menu:favorites'),
      Markup.button.callback('Bookings', 'menu:bookings'),
    ],
    [Markup.button.callback('Contact manager', 'menu:manager')],
  ])
}

export function adminMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Stats', 'admin:stats')],
    [Markup.button.callback('Broadcast help', 'admin:broadcast-help')],
  ])
}
