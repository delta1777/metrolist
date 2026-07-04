# Инструкция по настройке админ-панели

## 1. Создание конфигурации

Скопируйте файл `admin-config.example.js` в `admin-config.js`:

```bash
cp admin-config.example.js admin-config.js
```

## 2. Генерация хеша пароля

### Способ 1: Онлайн генератор
Перейдите на https://emn178.github.io/online-tools/sha256.html и введите ваш пароль

### Способ 2: Консоль браузера
Откройте консоль браузера (F12) и выполните:

```javascript
const password = 'your-password-here';
crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
    .then(h => {
        const hash = Array.from(new Uint8Array(h))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        console.log('Ваш хеш пароля:', hash);
    });
```

## 3. Настройка admin-config.js

Откройте `admin-config.js` и замените:

```javascript
export const ADMIN_CONFIG = {
    passwordHash: 'ВАШ_ХЕШ_ПАРОЛЯ_ЗДЕСЬ',
    adminEmail: 'your-email@example.com'
};
```

## 4. Безопасность

- Файл `admin-config.js` уже добавлен в `.gitignore` и не попадет в репозиторий
- **НИКОГДА** не коммитьте `admin-config.js` в Git
- Храните файл только локально
- При деплое создавайте `admin-config.js` вручную на сервере

## 5. Доступ к админпанели

1. Войдите в систему с email, указанным в `admin-config.js`
2. Перейдите на `/admin`
3. Введите пароль (не хеш, а обычный пароль)
4. Готово!

## Смена пароля

Если нужно сменить пароль:
1. Сгенерируйте новый хеш (шаг 2)
2. Замените `passwordHash` в `admin-config.js`
3. Перезагрузите страницу

## Смена email

Просто измените `adminEmail` в `admin-config.js` и перезагрузите страницу.
