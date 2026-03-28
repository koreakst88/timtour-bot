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
exports.supabase = void 0;
exports.saveUser = saveUser;
exports.getAllUsers = getAllUsers;
exports.getBotUsersCount = getBotUsersCount;
exports.touchUser = touchUser;
exports.isAdmin = isAdmin;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
exports.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function saveUser(user) {
    await exports.supabase
        .from('bot_users')
        .upsert({
        tg_id: user.tg_id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        last_active: new Date().toISOString(),
    }, { onConflict: 'tg_id' });
}
async function getAllUsers() {
    const { data } = await exports.supabase
        .from('bot_users')
        .select('tg_id');
    return data ?? [];
}
async function getBotUsersCount() {
    const { count } = await exports.supabase
        .from('bot_users')
        .select('*', { head: true, count: 'exact' });
    return count ?? 0;
}
async function touchUser(tgId) {
    await exports.supabase
        .from('bot_users')
        .update({ last_active: new Date().toISOString() })
        .eq('tg_id', tgId);
}
async function isAdmin(tg_id) {
    return tg_id === process.env.ADMIN_TG_ID;
}
