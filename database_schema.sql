-- Таблица уровней
CREATE TABLE IF NOT EXISTS levels (
    id BIGINT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    author TEXT NOT NULL,
    creators TEXT[] NOT NULL,
    verifier TEXT NOT NULL,
    verification TEXT NOT NULL,
    percent_to_qualify INTEGER DEFAULT 100,
    password TEXT DEFAULT 'Not Copyable',
    position INTEGER,
    list_type TEXT DEFAULT 'main' CHECK (list_type IN ('main', 'challenge', 'future')),
    best_progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица рекордов
CREATE TABLE IF NOT EXISTS records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id BIGINT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    link TEXT NOT NULL,
    percent INTEGER NOT NULL,
    hz INTEGER,
    mobile BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(level_id, username, percent)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_records_level_id ON records(level_id);
CREATE INDEX IF NOT EXISTS idx_records_username ON records(username);
CREATE INDEX IF NOT EXISTS idx_levels_name ON levels(name);
CREATE INDEX IF NOT EXISTS idx_levels_position ON levels(position);
CREATE INDEX IF NOT EXISTS idx_levels_list_type ON levels(list_type);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_levels_updated_at BEFORE UPDATE ON levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_records_updated_at BEFORE UPDATE ON records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
