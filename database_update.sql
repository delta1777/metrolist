-- Обновление существующей таблицы levels для добавления поля list_type

-- Добавляем колонку list_type если её ещё нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'levels' AND column_name = 'list_type'
    ) THEN
        ALTER TABLE levels ADD COLUMN list_type TEXT DEFAULT 'main' CHECK (list_type IN ('main', 'challenge', 'future'));
    END IF;
END $$;

-- Создаём индекс для быстрого поиска по типу списка
CREATE INDEX IF NOT EXISTS idx_levels_list_type ON levels(list_type);

-- Обновляем существующие записи, устанавливая тип 'main' если не указан
UPDATE levels SET list_type = 'main' WHERE list_type IS NULL;

-- Проверяем результат
SELECT
    list_type,
    COUNT(*) as count
FROM levels
GROUP BY list_type;
