"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.env = void 0;
exports.upsertBotUser = upsertBotUser;
exports.touchBotUser = touchBotUser;
exports.isAdmin = isAdmin;
exports.getBotUsers = getBotUsers;
exports.getBotUsersCount = getBotUsersCount;
const supabase_js_1 = require("@supabase/supabase-js");
const requiredEnv = ['BOT_TOKEN', 'ADMIN_TG_ID', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'TMA_URL'];
function readEnv() {
    const missing = requiredEnv.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    return {
        BOT_TOKEN: process.env.BOT_TOKEN,
        ADMIN_TG_ID: process.env.ADMIN_TG_ID,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        TMA_URL: process.env.TMA_URL,
    };
}
exports.env = readEnv();
exports.supabase = (0, supabase_js_1.createClient)(exports.env.SUPABASE_URL, exports.env.SUPABASE_ANON_KEY);
async function upsertBotUser(user) {
    const payload = {
        tg_id: user.tg_id,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        username: user.username ?? null,
        is_admin: user.tg_id === exports.env.ADMIN_TG_ID,
        last_active: new Date().toISOString(),
    };
    const { data, error } = await exports.supabase
        .from('bot_users')
        .upsert(payload, { onConflict: 'tg_id' })
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
}
async function touchBotUser(tgId) {
    const { error } = await exports.supabase
        .from('bot_users')
        .update({ last_active: new Date().toISOString() })
        .eq('tg_id', tgId);
    if (error) {
        throw error;
    }
}
async function isAdmin(tgId) {
    if (tgId === exports.env.ADMIN_TG_ID)
        return true;
    const { data, error } = await exports.supabase
        .from('bot_users')
        .select('is_admin')
        .eq('tg_id', tgId)
        .maybeSingle();
    if (error) {
        throw error;
    }
    return Boolean(data?.is_admin);
}
async function getBotUsers() {
    const { data, error } = await exports.supabase
        .from('bot_users')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) {
        throw error;
    }
    return (data ?? []);
}
async function getBotUsersCount() {
    const { count, error } = await exports.supabase
        .from('bot_users')
        .select('*', { head: true, count: 'exact' });
    if (error) {
        throw error;
    }
    return count ?? 0;
}
