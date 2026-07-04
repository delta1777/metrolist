# Настройка Supabase для MetroList

## 1. Создай проект на Supabase

1. Зайди на https://supabase.com
2. Создай аккаунт или войди
3. Нажми "New Project"
4. Название: `metrolist` (или любое другое)
5. Database Password: придумай надёжный пароль (сохрани его!)
6. Region: выбери ближайший к твоим пользователям
7. Дождись создания проекта (~2 минуты)

## 2. Получи API ключи

После создания проекта:
1. Перейди в **Settings** → **API**
2. Скопируй:
   - **Project URL** (например: `https://xyzcompany.supabase.co`)
   - **anon public** ключ (это безопасно для клиента)

## 3. Создай таблицы

Перейди в **SQL Editor** и выполни этот SQL:

```sql
-- Таблица пользователей
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица заявок
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('level', 'record')),
  username TEXT NOT NULL,
  video_link TEXT NOT NULL,
  
  -- Для уровней
  level_name TEXT NOT NULL,
  level_id TEXT,
  creators TEXT,
  verifier TEXT,
  password TEXT,
  
  -- Для прохождений
  progress INTEGER,
  completed_on_mobile BOOLEAN DEFAULT FALSE,
  
  -- Общие поля
  comments TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_submissions_username ON submissions(username);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_type ON submissions(type);

-- Row Level Security (RLS) - безопасность на уровне строк
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Политики доступа для users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own user" ON users FOR INSERT WITH CHECK (true);

-- Политики доступа для submissions
CREATE POLICY "Anyone can view all submissions" ON submissions FOR SELECT USING (true);
CREATE POLICY "Anyone can create submissions" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update submissions" ON submissions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete submissions" ON submissions FOR DELETE USING (true);
```

## 4. Добавь ключи в GitHub Secrets

1. Перейди: `https://github.com/delta1777/metrolist/settings/secrets/actions`
2. Добавь секреты:
   - `SUPABASE_URL` = твой Project URL
   - `SUPABASE_ANON_KEY` = твой anon public ключ

## 5. Готово!

После этого я обновлю код для работы с Supabase.
