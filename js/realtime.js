// Модуль для работы с Supabase Realtime
import { getSupabase } from './supabase.js';

class RealtimeManager {
    constructor() {
        this.channels = new Map();
    }

    /**
     * Подписаться на изменения в таблице
     * @param {string} table - название таблицы
     * @param {Function} callback - функция, вызываемая при изменении
     * @param {Object} options - дополнительные опции
     * @returns {Promise<Object>} channel
     */
    async subscribe(table, callback, options = {}) {
        const supabase = await getSupabase();
        if (!supabase) return null;

        const channelName = `${table}-changes-${Date.now()}`;

        const channel = supabase
            .channel(channelName)
            .on('postgres_changes',
                {
                    event: options.event || '*', // insert, update, delete, or *
                    schema: 'public',
                    table: table,
                    filter: options.filter
                },
                (payload) => {
                    console.log(`[Realtime] ${table} changed:`, payload);
                    callback(payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime] Subscribed to ${table}`);
                }
            });

        this.channels.set(channelName, channel);
        return channel;
    }

    /**
     * Отписаться от изменений
     * @param {string} channelName - название канала
     */
    async unsubscribe(channelName) {
        const channel = this.channels.get(channelName);
        if (channel) {
            const supabase = await getSupabase();
            if (supabase) {
                await supabase.removeChannel(channel);
                this.channels.delete(channelName);
                console.log(`[Realtime] Unsubscribed from ${channelName}`);
            }
        }
    }

    /**
     * Отписаться от всех каналов
     */
    async unsubscribeAll() {
        const supabase = await getSupabase();
        if (!supabase) return;

        for (const [name, channel] of this.channels.entries()) {
            await supabase.removeChannel(channel);
            console.log(`[Realtime] Unsubscribed from ${name}`);
        }
        this.channels.clear();
    }
}

// Синглтон
export const realtimeManager = new RealtimeManager();
