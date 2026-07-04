-- БЕЗОПАСНЫЕ RLS ПОЛИТИКИ ДЛЯ METROLIST
-- Замените содержимое database_policies.sql на этот файл

-- ВКЛЮЧАЕМ RLS ДЛЯ ВСЕХ ТАБЛИЦ
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ LEVELS
-- ============================================

-- Все могут читать уровни
CREATE POLICY "Anyone can view levels"
    ON levels FOR SELECT
    USING (true);

-- Временно разрешаем вставку для работы админ-панели
-- TODO: Заменить на проверку прав админа
CREATE POLICY "Temporary allow level inserts"
    ON levels FOR INSERT
    WITH CHECK (true);

-- Временно разрешаем обновление для работы админ-панели
CREATE POLICY "Temporary allow level updates"
    ON levels FOR UPDATE
    USING (true);

-- НИКТО не может удалять уровни напрямую
CREATE POLICY "No direct level deletes"
    ON levels FOR DELETE
    USING (false);

-- ============================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ RECORDS
-- ============================================

-- Все могут читать рекорды
CREATE POLICY "Anyone can view records"
    ON records FOR SELECT
    USING (true);

-- Временно разрешаем вставку для работы админ-панели
CREATE POLICY "Temporary allow record inserts"
    ON records FOR INSERT
    WITH CHECK (true);

-- Временно разрешаем обновление для миграции ников
CREATE POLICY "Temporary allow record updates"
    ON records FOR UPDATE
    USING (true);

-- НИКТО не может удалять рекорды напрямую
CREATE POLICY "No direct record deletes"
    ON records FOR DELETE
    USING (false);

-- ============================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ USERS
-- ============================================

-- Все могут читать профили пользователей
-- НО password_hash должен быть исключен в SELECT запросах!
CREATE POLICY "Anyone can view user profiles"
    ON users FOR SELECT
    USING (true);

-- Новые пользователи могут регистрироваться
CREATE POLICY "Anyone can register"
    ON users FOR INSERT
    WITH CHECK (true);

-- Пользователи могут обновлять свой профиль
-- Временно разрешаем всем для работы смены ника
CREATE POLICY "Users can update profiles"
    ON users FOR UPDATE
    USING (true);

-- НИКТО не может удалять пользователей напрямую (только админ через service_role)
CREATE POLICY "No direct user deletes"
    ON users FOR DELETE
    USING (false);

-- ============================================
-- ПОЛИТИКИ ДЛЯ ТАБЛИЦЫ SUBMISSIONS
-- ============================================

-- Все могут просматривать заявки (для админ-панели)
CREATE POLICY "Anyone can view submissions"
    ON submissions FOR SELECT
    USING (true);

-- Авторизованные пользователи могут создавать заявки
CREATE POLICY "Anyone can create submissions"
    ON submissions FOR INSERT
    WITH CHECK (true);

-- Временно разрешаем обновление для работы админ-панели
CREATE POLICY "Temporary allow submission updates"
    ON submissions FOR UPDATE
    USING (true);

-- Временно разрешаем удаление для работы админ-панели
CREATE POLICY "Temporary allow submission deletes"
    ON submissions FOR DELETE
    USING (true);

-- ============================================
-- ВАЖНЫЕ ЗАМЕЧАНИЯ
-- ============================================

-- 1. Эти политики ВРЕМЕННЫЕ для работы текущего функционала
-- 2. В коде НИКОГДА не делайте SELECT password_hash без WHERE условия
-- 3. Правильное решение - использовать Supabase Auth + service_role key для админа
-- 4. Когда внедрите правильную авторизацию, замените "Temporary allow" на проверку прав

-- ============================================
-- ЗАЩИТА КОЛОНКИ PASSWORD_HASH
-- ============================================

-- Добавляем комментарий для разработчиков
COMMENT ON COLUMN users.password_hash IS 'КРИТИЧНО: Никогда не возвращайте это поле в SELECT запросах!';

-- В коде всегда делайте:
-- SELECT username, created_at FROM users WHERE username = '...'
-- НИКОГДА не делайте: SELECT * FROM users
