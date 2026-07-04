// ВАЛИДАЦИЯ И САНИТИЗАЦИЯ ПОЛЬЗОВАТЕЛЬСКОГО ВВОДА

/**
 * Санитизация HTML для предотвращения XSS
 * @param {string} str - строка для санитизации
 * @returns {string} - безопасная строка
 */
export function sanitizeHTML(str) {
    if (!str) return '';

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Валидация имени пользователя
 * @param {string} username
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateUsername(username) {
    if (!username || username.trim().length === 0) {
        return { valid: false, error: 'Имя пользователя не может быть пустым' };
    }

    if (username.length < 3) {
        return { valid: false, error: 'Минимум 3 символа' };
    }

    if (username.length > 50) {
        return { valid: false, error: 'Максимум 50 символов' };
    }

    // Разрешаем только буквы, цифры, подчеркивание, дефис
    const validPattern = /^[a-zA-Z0-9_\-а-яА-ЯёЁ]+$/;
    if (!validPattern.test(username)) {
        return { valid: false, error: 'Разрешены только буквы, цифры, _ и -' };
    }

    return { valid: true };
}

/**
 * Валидация пароля
 * @param {string} password
 * @returns {Object} {valid: boolean, error: string, strength: string}
 */
export function validatePassword(password) {
    if (!password) {
        return { valid: false, error: 'Пароль не может быть пустым', strength: 'none' };
    }

    if (password.length < 8) {
        return { valid: false, error: 'Минимум 8 символов', strength: 'weak' };
    }

    if (password.length > 128) {
        return { valid: false, error: 'Максимум 128 символов', strength: 'none' };
    }

    // Проверка силы пароля
    let strength = 'weak';
    let strengthPoints = 0;

    if (password.length >= 12) strengthPoints++;
    if (/[a-z]/.test(password)) strengthPoints++;
    if (/[A-Z]/.test(password)) strengthPoints++;
    if (/[0-9]/.test(password)) strengthPoints++;
    if (/[^a-zA-Z0-9]/.test(password)) strengthPoints++;

    if (strengthPoints >= 4) strength = 'strong';
    else if (strengthPoints >= 3) strength = 'medium';

    // Проверка на популярные пароли
    const commonPasswords = [
        'password', 'password123', '12345678', 'qwerty', 'abc123',
        '111111', '123123', 'password1', 'admin', 'letmein'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
        return { valid: false, error: 'Слишком простой пароль', strength: 'weak' };
    }

    return { valid: true, strength };
}

/**
 * Валидация URL (YouTube ссылки)
 * @param {string} url
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateVideoURL(url) {
    if (!url || url.trim().length === 0) {
        return { valid: false, error: 'URL не может быть пустым' };
    }

    if (url.length > 500) {
        return { valid: false, error: 'URL слишком длинный' };
    }

    const allowedDomains = [
        'youtube.com', 'youtu.be', 'twitch.tv', 'bilibili.com'
    ];

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace('www.', '');

        const isAllowed = allowedDomains.some(domain =>
            hostname === domain || hostname.endsWith('.' + domain)
        );

        if (!isAllowed) {
            return { valid: false, error: 'Разрешены только YouTube, Twitch, Bilibili' };
        }

        if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
            return { valid: false, error: 'Недопустимый протокол URL' };
        }

        return { valid: true };
    } catch (e) {
        return { valid: false, error: 'Неверный формат URL' };
    }
}

/**
 * Валидация названия уровня
 * @param {string} name
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateLevelName(name) {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Название не может быть пустым' };
    }

    if (name.length < 3) {
        return { valid: false, error: 'Минимум 3 символа' };
    }

    if (name.length > 100) {
        return { valid: false, error: 'Максимум 100 символов' };
    }

    return { valid: true };
}

/**
 * Валидация ID уровня
 * @param {string|number} levelId
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateLevelId(levelId) {
    const id = parseInt(levelId);

    if (isNaN(id)) {
        return { valid: false, error: 'ID должен быть числом' };
    }

    if (id < 1 || id > 999999999) {
        return { valid: false, error: 'Недопустимый ID уровня' };
    }

    return { valid: true };
}

/**
 * Валидация процента прохождения
 * @param {string|number} progress
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateProgress(progress) {
    const percent = parseInt(progress);

    if (isNaN(percent)) {
        return { valid: false, error: 'Прогресс должен быть числом' };
    }

    if (percent < 0 || percent > 100) {
        return { valid: false, error: 'Прогресс от 0 до 100' };
    }

    return { valid: true };
}

/**
 * Валидация комментария
 * @param {string} comment
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateComment(comment) {
    if (!comment) return { valid: true };

    if (comment.length > 1000) {
        return { valid: false, error: 'Максимум 1000 символов' };
    }

    return { valid: true };
}

/**
 * Комплексная валидация заявки
 * @param {Object} data - данные заявки
 * @returns {Object} {valid: boolean, errors: Object}
 */
export function validateSubmission(data) {
    const errors = {};

    const usernameCheck = validateUsername(data.username);
    if (!usernameCheck.valid) {
        errors.username = usernameCheck.error;
    }

    const urlCheck = validateVideoURL(data.videoLink);
    if (!urlCheck.valid) {
        errors.videoLink = urlCheck.error;
    }

    const nameCheck = validateLevelName(data.levelName);
    if (!nameCheck.valid) {
        errors.levelName = nameCheck.error;
    }

    if (data.type === 'level') {
        const idCheck = validateLevelId(data.levelId);
        if (!idCheck.valid) {
            errors.levelId = idCheck.error;
        }

        const creatorsCheck = validateLevelName(data.creators);
        if (!creatorsCheck.valid) {
            errors.creators = creatorsCheck.error;
        }

        const verifierCheck = validateUsername(data.verifier);
        if (!verifierCheck.valid) {
            errors.verifier = verifierCheck.error;
        }
    } else {
        const progressCheck = validateProgress(data.progress);
        if (!progressCheck.valid) {
            errors.progress = progressCheck.error;
        }
    }

    if (data.comments) {
        const commentCheck = validateComment(data.comments);
        if (!commentCheck.valid) {
            errors.comments = commentCheck.error;
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}
