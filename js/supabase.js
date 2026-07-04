// Supabase клиент
// Загружаем конфигурацию
let supabaseClient = null;

export async function getSupabase() {
    if (supabaseClient) return supabaseClient;

    try {
        // Импортируем конфигурацию
        const { SUPABASE_CONFIG } = await import('./supabase-config.js');

        // Загружаем Supabase клиент из CDN
        if (!window.supabase) {
            throw new Error('Supabase library not loaded');
        }

        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );

        return supabaseClient;
    } catch (error) {
        console.error('Supabase config not found:', error);
        return null;
    }
}

// Хеширование пароля
export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
