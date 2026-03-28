import { Context, Markup } from 'telegraf'
import { getAllUsers, isAdmin } from '../services/supabase'
import type { TimTourBot } from '../types'

type BroadcastStep = 'template' | 'field_1' | 'field_2' | 'field_3' | 'confirm'
type BroadcastTemplate = 'hot' | 'weekend' | 'new' | 'custom'

type BroadcastState = {
  step: BroadcastStep
  template: BroadcastTemplate
  fields: Record<string, string>
}

const broadcastState = new Map<string, BroadcastState>()

const TEMPLATES: Record<BroadcastTemplate, string> = {
  hot: '🔥 Горящий тур\n📍 {направление}\n📅 {даты}\n💰 {цена}',
  weekend: '✈️ Тур выходного дня\n📍 {направление}',
  new: '🆕 Новый тур\n\n{название тура}',
  custom: '',
}

const FIELD_LABELS: Record<BroadcastTemplate, Array<{ key: string; prompt: string }>> = {
  hot: [
    { key: 'направление', prompt: 'Введите направление:' },
    { key: 'даты', prompt: 'Введите даты:' },
    { key: 'цена', prompt: 'Введите цену:' },
  ],
  weekend: [{ key: 'направление', prompt: 'Введите направление:' }],
  new: [{ key: 'название тура', prompt: 'Введите название тура:' }],
  custom: [{ key: 'text', prompt: 'Введите текст рассылки:' }],
}

function isAdminUser(ctx: Context) {
  const userId = ctx.from?.id?.toString()
  return Boolean(userId && isAdmin(userId))
}

function getState(userId: string) {
  return broadcastState.get(userId)
}

function setState(userId: string, state: BroadcastState) {
  broadcastState.set(userId, state)
}

function clearState(userId: string) {
  broadcastState.delete(userId)
}

function getCurrentFieldIndex(state: BroadcastState) {
  return state.step === 'field_1' ? 0 : state.step === 'field_2' ? 1 : 2
}

function getNextStep(step: BroadcastStep) {
  if (step === 'field_1') return 'field_2'
  if (step === 'field_2') return 'field_3'
  return 'confirm'
}

function buildPreviewText(state: BroadcastState) {
  if (state.template === 'custom') {
    return state.fields.text ?? ''
  }

  return TEMPLATES[state.template]
    .replace('{направление}', state.fields['направление'] ?? '')
    .replace('{даты}', state.fields['даты'] ?? '')
    .replace('{цена}', state.fields['цена'] ?? '')
    .replace('{название тура}', state.fields['название тура'] ?? '')
}

function getTemplateKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔥 Горящий тур', 'tmpl_hot')],
    [Markup.button.callback('✈️ Тур выходного дня', 'tmpl_weekend')],
    [Markup.button.callback('🆕 Новый тур', 'tmpl_new')],
    [Markup.button.callback('✏️ Свой текст', 'tmpl_custom')],
    [Markup.button.callback('❌ Отмена', 'broadcast_cancel')],
  ])
}

function getConfirmKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Отправить', 'broadcast_confirm'),
      Markup.button.callback('❌ Отмена', 'broadcast_cancel'),
    ],
  ])
}

export function isBroadcastInProgress(userId: string) {
  const state = getState(userId)
  return Boolean(state && state.step !== 'template')
}

export async function handleBroadcast(ctx: Context) {
  const userId = String(ctx.from!.id)

  setState(userId, {
    step: 'template',
    template: 'custom',
    fields: {},
  })

  await ctx.reply('📢 Выберите шаблон рассылки:', getTemplateKeyboard())
}

export async function handleTemplateSelect(ctx: Context, template: string) {
  const userId = String(ctx.from!.id)
  const selectedTemplate = template as BroadcastTemplate
  const firstField = FIELD_LABELS[selectedTemplate]?.[0]

  setState(userId, {
    step: 'field_1',
    template: selectedTemplate,
    fields: {},
  })

  await ctx.reply(firstField?.prompt ?? 'Введите текст рассылки:')
}

export async function handleBroadcastText(ctx: Context, text: string) {
  const userId = String(ctx.from!.id)
  const state = getState(userId)

  if (!state || state.step === 'template' || state.step === 'confirm') return false

  const fieldIndex = getCurrentFieldIndex(state)
  const fieldConfig = FIELD_LABELS[state.template][fieldIndex]

  if (!fieldConfig) return false

  const nextFields = {
    ...state.fields,
    [fieldConfig.key]: text,
  }

  const hasNextField = fieldIndex + 1 < FIELD_LABELS[state.template].length
  const nextStep = getNextStep(state.step)

  if (hasNextField) {
    setState(userId, {
      ...state,
      step: nextStep as BroadcastStep,
      fields: nextFields,
    })

    await ctx.reply(FIELD_LABELS[state.template][fieldIndex + 1].prompt)
    return true
  }

  const finalText = buildPreviewText({
    ...state,
    step: 'confirm',
    fields: nextFields,
  })

  setState(userId, {
    ...state,
    step: 'confirm',
    fields: nextFields,
  })

  await ctx.reply(
    `📋 Превью рассылки:\n\n${finalText}\n\nОтправить всем пользователям?`,
    getConfirmKeyboard(),
  )

  return true
}

export async function sendBroadcast(ctx: Context, bot: TimTourBot) {
  const userId = String(ctx.from!.id)
  const state = getState(userId)

  if (!state) return

  const finalText = buildPreviewText(state)

  if (!finalText) return

  const users = await getAllUsers()
  let sent = 0
  let failed = 0

  await ctx.reply('📤 Отправляю рассылку...')

  for (const user of users) {
    try {
      await bot.telegram.sendMessage(user.tg_id, finalText, {
        link_preview_options: { is_disabled: true },
      })
      sent += 1
      await new Promise((resolve) => setTimeout(resolve, 50))
    } catch {
      failed += 1
    }
  }

  clearState(userId)

  await ctx.reply(
    `✅ Рассылка завершена!\n\n📤 Отправлено: ${sent}\n❌ Не доставлено: ${failed}`,
  )
}

export async function cancelBroadcast(ctx: Context) {
  const userId = String(ctx.from!.id)
  clearState(userId)
  await ctx.reply('Рассылка отменена.')
}

export function registerBroadcastHandlers(bot: TimTourBot) {
  bot.command('broadcast', async (ctx) => {
    const userId = String(ctx.from?.id ?? '')

    if (!userId || !(await isAdmin(userId))) {
      await ctx.reply('Admin access required.')
      return
    }

    await handleBroadcast(ctx)
  })

  bot.action(/^tmpl_(.+)$/, async (ctx) => {
    const userId = String(ctx.from?.id ?? '')

    if (!userId || !(await isAdmin(userId))) {
      await ctx.answerCbQuery('Admin only')
      return
    }

    const template = ctx.match[1]
    await ctx.answerCbQuery('Шаблон выбран')
    await handleTemplateSelect(ctx, template)
  })

  bot.action('broadcast_confirm', async (ctx) => {
    const userId = String(ctx.from?.id ?? '')

    if (!userId || !(await isAdmin(userId))) {
      await ctx.answerCbQuery('Admin only')
      return
    }

    await ctx.answerCbQuery('Отправляю')
    await sendBroadcast(ctx, bot)
  })

  bot.action('broadcast_cancel', async (ctx) => {
    const userId = String(ctx.from?.id ?? '')

    if (!userId || !(await isAdmin(userId))) {
      await ctx.answerCbQuery('Admin only')
      return
    }

    await ctx.answerCbQuery('Отменено')
    await cancelBroadcast(ctx)
  })
}
