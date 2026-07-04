# Деплой на GitHub Pages с защищенной админ-панелью

## Настройка GitHub Secrets

1. Перейдите в ваш репозиторий на GitHub
2. Откройте **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**

### Создайте два секрета:

**Секрет 1: `ADMIN_PASSWORD_HASH`**
- Name: `ADMIN_PASSWORD_HASH`
- Value: ваш хеш пароля (сгенерируйте его как описано в ADMIN_SETUP.md)

**Секрет 2: `ADMIN_EMAIL`**
- Name: `ADMIN_EMAIL`  
- Value: ваш email (например, `deltared322@gmail.com`)

## Настройка GitHub Pages

1. В настройках репозитория откройте **Settings** → **Pages**
2. В разделе **Source** выберите **GitHub Actions**
3. Сохраните

## Как это работает

1. При каждом пуше в ветку `main` автоматически запускается GitHub Action
2. Action создает файл `admin-config.js` из секретов
3. Деплоит сайт с этим файлом на GitHub Pages
4. Секреты не видны в публичном репозитории

## Первый деплой

После настройки секретов:

```bash
git add .
git commit -m "Add admin panel with GitHub Actions"
git push origin main
```

GitHub автоматически задеплоит сайт с админ-панелью.

## Проверка

1. Откройте ваш сайт: `https://ваш-username.github.io/ваш-репозиторий/`
2. Перейдите на `/admin`
3. Войдите с вашим email и паролем

## Альтернатива: Локальный деплой (без GitHub Actions)

Если не хотите использовать GitHub Actions:

1. Создайте ветку `gh-pages` локально
2. Добавьте туда `admin-config.js` вручную
3. Запушьте только ветку `gh-pages`:

```bash
# Создайте gh-pages ветку
git checkout -b gh-pages

# Создайте admin-config.js локально
cp admin-config.example.js admin-config.js
# Отредактируйте admin-config.js с вашими данными

# Добавьте в индекс
git add -f admin-config.js

# Коммит
git commit -m "Add admin config for deployment"

# Пуш только gh-pages
git push origin gh-pages

# Вернитесь на main
git checkout main
```

В Settings → Pages выберите ветку `gh-pages` как источник.

**Важно:** В этом случае `admin-config.js` будет в публичной ветке `gh-pages`, но если репозиторий приватный - это безопасно.
