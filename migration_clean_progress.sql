-- Удаляем старые колонки если они есть
ALTER TABLE levels
DROP COLUMN IF EXISTS progress_start,
DROP COLUMN IF EXISTS progress_end,
DROP COLUMN IF EXISTS first_progress,
DROP COLUMN IF EXISTS max_progress;

-- Добавляем единственную колонку best_progress
ALTER TABLE levels
ADD COLUMN IF NOT EXISTS best_progress INTEGER DEFAULT 0;
