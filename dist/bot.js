"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const dotenv = __importStar(require("dotenv"));
const cron = __importStar(require("node-cron"));
const start_1 = require("./handlers/start");
const admin_1 = require("./handlers/admin");
const broadcast_1 = require("./handlers/broadcast");
const supabase_1 = require("./services/supabase");
dotenv.config();
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
bot.use(async (ctx, next) => {
    if (ctx.from) {
        await Promise.resolve().then(() => __importStar(require('./services/supabase'))).then(({ saveUser }) => saveUser({
            tg_id: String(ctx.from.id),
            first_name: ctx.from.first_name,
            last_name: ctx.from.last_name,
            username: ctx.from.username,
        }));
    }
    return next();
});
bot.start(async (ctx) => {
    const payload = 'startPayload' in ctx ? ctx.startPayload : undefined;
    if (payload) {
        await (0, start_1.handleDeepLink)(ctx, payload);
    }
    else {
        await (0, start_1.handleStart)(ctx);
    }
});
bot.command('catalog', async (ctx) => {
    const TMA_URL = process.env.TMA_URL;
    await ctx.reply('🗺️ Открываю каталог туров...', telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.webApp('🗺️ Каталог туров', `${TMA_URL}/catalog`)],
    ]));
});
bot.command('bookings', async (ctx) => {
    const TMA_URL = process.env.TMA_URL;
    await ctx.reply('📋 Открываю ваши заявки...', telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.webApp('📋 Мои заявки', `${TMA_URL}/bookings`)],
    ]));
});
bot.command('help', async (ctx) => {
    await ctx.reply(`
❓ Помощь TimTour

🗺️ /catalog — Смотреть все туры
📋 /bookings — Ваши заявки
💬 Написать менеджеру: @TimTour_WW

По всем вопросам обращайтесь к менеджеру!
  `);
});
bot.command('admin', async (ctx) => {
    if (!(await (0, supabase_1.isAdmin)(String(ctx.from.id))))
        return;
    const TMA_URL = process.env.TMA_URL;
    await ctx.reply('⚙️ Панель управления', telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.webApp('⚙️ Открыть панель', `${TMA_URL}/admin`)],
    ]));
});
bot.command('broadcast', async (ctx) => {
    if (!(await (0, supabase_1.isAdmin)(String(ctx.from.id))))
        return;
    await (0, broadcast_1.handleBroadcast)(ctx);
});
bot.command('stats', async (ctx) => {
    if (!(await (0, supabase_1.isAdmin)(String(ctx.from.id))))
        return;
    await (0, admin_1.handleStats)(ctx);
});
bot.on('callback_query', async (ctx) => {
    const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
    const userId = String(ctx.from.id);
    const admin = await (0, supabase_1.isAdmin)(userId);
    if (!admin) {
        await ctx.answerCbQuery('Нет доступа');
        return;
    }
    if (data === 'broadcast') {
        await (0, broadcast_1.handleBroadcast)(ctx);
    }
    else if (typeof data === 'string' && data.startsWith('tmpl_')) {
        const template = data.replace('tmpl_', '');
        await (0, broadcast_1.handleTemplateSelect)(ctx, template);
    }
    else if (data === 'broadcast_confirm') {
        await (0, broadcast_1.sendBroadcast)(ctx, bot);
    }
    else if (data === 'broadcast_cancel') {
        await (0, broadcast_1.cancelBroadcast)(ctx);
    }
    await ctx.answerCbQuery();
});
bot.on('text', async (ctx) => {
    const userId = String(ctx.from.id);
    const admin = await (0, supabase_1.isAdmin)(userId);
    if (admin && (0, broadcast_1.isBroadcastInProgress)(userId)) {
        await (0, broadcast_1.handleBroadcastText)(ctx, ctx.message.text);
    }
});
bot.on('channel_post', async (ctx) => {
    const post = ctx.channelPost;
    const TMA_URL = process.env.TMA_URL;
    if ('text' in post || 'caption' in post) {
        const text = ('text' in post ? post.text : post.caption) ?? '';
        if (text.includes('#тур') || text.includes('#tour') || text.includes('#timtour')) {
            try {
                await ctx.telegram.editMessageReplyMarkup(ctx.chat.id, post.message_id, undefined, {
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
                });
            }
            catch (error) {
                console.error('Channel post error:', error);
            }
        }
    }
});
cron.schedule('0 10 * * *', async () => {
    console.log('Running reminder cron job...');
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const dateStr = threeDaysFromNow.toISOString().split('T')[0];
    const { data: bookings } = await supabase_1.supabase
        .from('bookings')
        .select('*, tour:tours(title)')
        .eq('status', 'confirmed')
        .eq('travel_date', dateStr);
    if (!bookings?.length)
        return;
    for (const booking of bookings) {
        try {
            await bot.telegram.sendMessage(booking.user_tg_id, `⏰ ${booking.user_name}, напоминаем!\n\n` +
                `Ваш тур начинается через 3 дня ✈️\n` +
                `🗺️ ${booking.tour?.title}\n` +
                `📅 ${booking.travel_date}\n\n` +
                `По вопросам: @TimTour_WW`);
        }
        catch (error) {
            console.error('Reminder error:', error);
        }
    }
});
async function configureCommands() {
    try {
        await bot.telegram.setMyCommands([
            { command: 'start', description: '🏠 Главное меню' },
            { command: 'catalog', description: '🗺️ Каталог туров' },
            { command: 'bookings', description: '📋 Мои заявки' },
            { command: 'help', description: '❓ Помощь' },
        ]);
        const adminTgId = process.env.ADMIN_TG_ID;
        if (adminTgId) {
            await bot.telegram.setMyCommands([
                { command: 'start', description: '🏠 Главное меню' },
                { command: 'admin', description: '⚙️ Панель управления' },
                { command: 'broadcast', description: '📢 Рассылка' },
                { command: 'stats', description: '📊 Статистика' },
                { command: 'catalog', description: '🗺️ Каталог туров' },
                { command: 'bookings', description: '📋 Мои заявки' },
            ], {
                scope: {
                    type: 'chat',
                    chat_id: Number(adminTgId),
                },
            });
        }
    }
    catch (error) {
        console.error('Failed to configure bot commands', error);
    }
}
async function main() {
    await bot.launch();
    console.log('TimTour bot started! 🚀');
    await configureCommands();
}
main().catch((error) => {
    console.error('Failed to start bot', error);
    process.exit(1);
});
process.once('SIGUSR2', () => bot.stop('SIGUSR2'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
