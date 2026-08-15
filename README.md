# Türkçe Kelimeler — тренажёр турецкой лексики (с аккаунтами)

Форк личного [turkish-vocab-app](../turkish-vocab-app) с настоящими
пользовательскими аккаунтами (email + пароль, без подтверждения почты)
вместо одного общего пароля — каждый пользователь видит только свои слова.
Переводы и транскрипция идут через Claude API (ключ живёт только на
сервере, общий на всех пользователей — про лимиты см. ниже).

## 1. Локальная настройка

```bash
npm install
cp .env.example .env.local
```

Открой `.env.local` и заполни:

- `DATABASE_URL` — connection string из **новой** Neon-базы (см. шаг 2) —
  не переиспользуй базу личного приложения
- `ANTHROPIC_API_KEY` — ключ с https://platform.claude.com
- `SESSION_SECRET` — любая длинная случайная строка, своя для этого деплоя
- `NEXT_PUBLIC_APP_LANGUAGE` / `NEXT_PUBLIC_NATIVE_LANGUAGE` — какой язык
  учим / на каком объясняем (см. `lib/language.ts`)

```bash
npm run dev
```

Открой http://localhost:3000 — перекинет на `/login`, там ссылка на
`/signup` для регистрации.

## 2. База данных (Neon)

Так же, как в личном приложении — через Vercel → **Storage** →
**Create Database → Postgres (Neon)**, или напрямую на neon.tech.
Таблицы (`users`, `words`, `streak_days`) создадутся сами при первом
запросе.

## 3. Git + GitHub + Vercel

Тот же порядок, что и раньше: `git init` → пустой репозиторий на
GitHub → `git remote add origin ...` → `git push` → Vercel **Add New →
Project** → выбрать репозиторий → добавить переменные окружения из
`.env.local` в Settings → Environment Variables → Deploy.

## Известное ограничение этой версии

Пока **нет лимита на количество AI-вызовов на пользователя** — все
зарегистрированные делят один `ANTHROPIC_API_KEY`. Не раздавай ссылку
на регистрацию широко, пока не появятся лимиты — это следующий шаг.

## Структура проекта (что изменилось относительно личного приложения)

```
app/
  signup/page.tsx          — регистрация (email + пароль)
  login/page.tsx            — вход (email + пароль)
  api/signup/route.ts       — создание аккаунта, хеширование пароля, автовход
  api/login/route.ts        — проверка email+пароля, выдача сессии
  api/logout/route.ts       — очистка сессионной куки
  api/words/*, api/streak/* — те же роуты, но все запросы теперь
                               скоуплены по user_id из сессии
lib/
  password.ts                — PBKDF2-хеширование паролей (Web Crypto)
  auth.ts                    — подпись/проверка сессионного токена (HMAC),
                                getCurrentUserId() для роутов
  db.ts                      — схема с users/words/streak_days и user_id
proxy.ts                     — проверяет сессионную куку, пускает /login и /signup
```
