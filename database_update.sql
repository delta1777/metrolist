-- Добавление новых полей в таблицу submissions
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS list_type VARCHAR(20) DEFAULT 'main',
ADD COLUMN IF NOT EXISTS best_progress INTEGER DEFAULT 0;

-- Добавление поля best_progress в таблицу levels (если еще не добавлено)
ALTER TABLE levels
ADD COLUMN IF NOT EXISTS best_progress INTEGER DEFAULT 0;

-- Обновление существующих записей submissions без list_type
UPDATE submissions
SET list_type = 'main'
WHERE list_type IS NULL AND type = 'level';

-- Комментарии
COMMENT ON COLUMN submissions.list_type IS 'Тип списка для уровня: main, challenge, future';
COMMENT ON COLUMN submissions.best_progress IS 'Лучший прогресс для будущих уровней (0-100)';
COMMENT ON COLUMN levels.best_progress IS 'Лучший прогресс для будущих уровней (0-100)';
