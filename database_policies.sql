-- Настройка политик безопасности (RLS) для таблиц

-- Вариант 1: Отключить RLS (проще, но менее безопасно)
-- Используйте этот вариант для быстрого старта

ALTER TABLE levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE records DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Вариант 2: Настроить политики (более безопасно)
-- Закомментирован по умолчанию, используйте если нужна безопасность

/*
-- Включаем RLS
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Политики для levels: все могут читать, никто не может редактировать
CREATE POLICY "Levels are viewable by everyone"
    ON levels FOR SELECT
    USING (true);

CREATE POLICY "Levels can be inserted by anon"
    ON levels FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Levels can be updated by anon"
    ON levels FOR UPDATE
    USING (true);

-- Политики для records: все могут читать, никто не может редактировать
CREATE POLICY "Records are viewable by everyone"
    ON records FOR SELECT
    USING (true);

CREATE POLICY "Records can be inserted by anon"
    ON records FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Records can be updated by anon"
    ON records FOR UPDATE
    USING (true);

-- Политики для users: все могут читать и создавать
CREATE POLICY "Users are viewable by everyone"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Users can be inserted by anon"
    ON users FOR INSERT
    WITH CHECK (true);

-- Политики для submissions: все могут читать и создавать
CREATE POLICY "Submissions are viewable by everyone"
    ON submissions FOR SELECT
    USING (true);

CREATE POLICY "Submissions can be inserted by anon"
    ON submissions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Submissions can be updated by anon"
    ON submissions FOR UPDATE
    USING (true);

CREATE POLICY "Submissions can be deleted by anon"
    ON submissions FOR DELETE
    USING (true);
*/
