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

/**
 * Безопасное хеширование пароля с использованием PBKDF2
 * @param {string} password - пароль для хеширования
 * @returns {Promise<string>} - хеш в формате "salt:hash"
 */
export async function hashPassword(password) {
    // Генерируем случайную соль (16 байт)
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Импортируем пароль как ключ
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    // Используем PBKDF2 с 100,000 итераций
    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,  // Медленное хеширование = защита от брутфорса
            hash: 'SHA-256'
        },
        passwordKey,
        256  // 32 байта выходных данных
    );

    // Конвертируем в hex строки
    const saltHex = Array.from(salt)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // Возвращаем в формате "salt:hash"
    return `${saltHex}:${hashHex}`;
}

/**
 * Проверка пароля против хеша
 * @param {string} password - введенный пароль
 * @param {string} storedHash - сохраненный хеш в формате "salt:hash"
 * @returns {Promise<boolean>} - совпадает ли пароль
 */
export async function verifyPassword(password, storedHash) {
    // Проверяем старый формат (SHA-256 без соли) для обратной совместимости
    if (!storedHash.includes(':')) {
        // Старый формат - простой SHA-256
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return computedHash === storedHash;
    }

    // Новый формат - разделяем соль и хеш
    const [saltHex, hashHex] = storedHash.split(':');

    if (!saltHex || !hashHex) {
        console.error('Invalid hash format');
        return false;
    }

    // Конвертируем hex соль обратно в Uint8Array
    const salt = new Uint8Array(
        saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );

    // Хешируем введенный пароль с той же солью
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passwordKey,
        256
    );

    const computedHashHex = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // Сравниваем хеши
    return computedHashHex === hashHex;
}
