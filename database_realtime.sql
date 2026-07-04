-- Включение Realtime для таблиц

-- ВАЖНО: Выполните эти команды в Supabase SQL Editor

-- 1. Включаем Realtime для таблицы submissions
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;

-- 2. Включаем Realtime для таблицы users
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- 3. Включаем Realtime для таблицы records
ALTER PUBLICATION supabase_realtime ADD TABLE records;

-- 4. Включаем Realtime для таблицы levels
ALTER PUBLICATION supabase_realtime ADD TABLE levels;

-- Проверка: посмотреть какие таблицы подключены к Realtime
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
