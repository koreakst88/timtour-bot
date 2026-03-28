"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainMenu = mainMenu;
exports.adminMenu = adminMenu;
const telegraf_1 = require("telegraf");
const supabase_1 = require("./services/supabase");
function mainMenu() {
    return telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.webApp('Open TimTour', supabase_1.env.TMA_URL)],
        [
            telegraf_1.Markup.button.callback('Favorites', 'menu:favorites'),
            telegraf_1.Markup.button.callback('Bookings', 'menu:bookings'),
        ],
        [telegraf_1.Markup.button.callback('Contact manager', 'menu:manager')],
    ]);
}
function adminMenu() {
    return telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.callback('Stats', 'admin:stats')],
        [telegraf_1.Markup.button.callback('Broadcast help', 'admin:broadcast-help')],
    ]);
}
