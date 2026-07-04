// Пример конфигурации для админ-панели
// Скопируйте этот файл как js/admin-config.js и укажите свои данные

export const ADMIN_CONFIG = {
    // Хеш вашего пароля (SHA-256)
    // Сгенерируйте его на https://emn178.github.io/online-tools/sha256.html
    // или выполните в консоли браузера:
    // crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-password')).then(h => console.log(Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('')))
    passwordHash: 'YOUR_PASSWORD_HASH_HERE',

    // Ник администратора в GD
    adminUsername: 'YourGDUsername'
};
