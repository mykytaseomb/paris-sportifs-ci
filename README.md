# paris-sportifs.com.ci — сайт на Astro (прототип)

Статический сайт-рейтинг по образцу casino.ru: одна база операторов, много посадочных-рейтингов поверх неё и 4 страницы на каждого оператора. На хостинг уходят готовые HTML-файлы, поэтому на сервере ничего разворачивать не нужно.

## Что в архиве

| Папка | Что это |
|---|---|
| `source/` | Исходники проекта, хранить в GitHub |
| `dist-upload/` | Готовый сайт. Залить содержимое в `public_html/` на Namecheap (вместе со скрытым `.htaccess`) |
| `apercu/` | Та же версия с относительными ссылками: открыть `apercu/index.html` двойным кликом |

## Страницы (25 + редиректы)

- `/` — главная: топ-3, теги, рейтинг 10 операторов, оплата, LONACI, FAQ
- Посадочные-рейтинги: `/application-paris-sportif/`, `/paris-sportif-apk/`, `/bonus-paris-sportif/`, `/paris-sportif-gratuit/`, `/paris-en-direct/`, `/paris-sportif-orange-money/`, `/paris-sportif-wave/`
- Меню в шапке: `menu` в `src/data/meta.json` (категории и подкатегории), фильтры над рейтингом: `tags`
- Порядок: операторы с полем `priority` (Melbet = 1, 1xBet = 2) всегда идут первыми в любом рейтинге
- Спорт и игры (7): `/paris-sportif-foot/`, `/paris-basket/`, `/paris-tennis/`, `/paris-hockey-sur-glace/`, `/paris-fifa/`, `/paris-des/`, `/seka/`. Рейтинг на них фильтруется по полю `sports` в `operators.json` (только проверенные данные).
- 1xBet: `/1xbet/` (обзор), `/1xbet-apk/`, `/code-promo-1xbet/`, `/1xbet-inscription/`
- Служебные: `/methodologie/`, `/jeu-responsable/`, `/a-propos/`, `/contact/`, `/mentions-legales/`, `404`
- `/go/{оператор}/`, `/go/{оператор}-apk/`, `/go/{оператор}-promo/` — 302-редиректы на партнёрские ссылки (правила в `.htaccess` + запасные HTML-страницы), закрыты в `robots.txt`
- `sitemap-index.xml`, `robots.txt`, разметка FAQPage, BreadcrumbList, Organization

## Схема URL (как у casino.ru)

Все адреса одноуровневые, без папок. Слаг повторяет главный запрос страницы в самом частотном порядке слов (по Ahrefs, CI).

| Тип страницы | Шаблон | Пример | Главный запрос (объём CI) |
|---|---|---|---|
| Обзор оператора | `/{бренд}/` | `/1xbet/` | 1xbet cote d'ivoire, 1xbet ci |
| Приложение | `/{бренд}-apk/` | `/1xbet-apk/` | 1xbet apk — 51 000 (apk 1xbet — 1 100) |
| Бонус / промокод | `/code-promo-{бренд}/` | `/code-promo-1xbet/` | code promo 1xbet — 4 100 (1xbet code promo — 150) |
| Регистрация | `/{бренд}-inscription/` | `/1xbet-inscription/` | 1xbet inscription — 2 500 (inscription 1xbet — 450) |
| Посадочная-рейтинг | `/{запрос}/` | `/application-paris-sportif/`, `/bonus-paris-sportif/`, `/paris-sportif-orange-money/` | application de paris sportif — 250, bonus paris sportif — 60 |
| Служебные | `/{слово}/` | `/a-propos/`, `/jeu-responsable/` | — |

Новые посадочные называются так же, по главному запросу: `/paris-sportif-wave/`, `/bonus-sans-depot-paris-sportif/`, `/casino-en-ligne/`.

## Как это устроено

```
source/
├── src/data/operators.json   ← ВСЕ данные операторов: бонус, промокод, реф-ссылки, платёжки, устройства, оценка, бейдж
├── src/data/meta.json        ← платёжные системы, устройства, меню, теги рейтинга
├── src/content/pages/*.mdx   ← тексты страниц (frontmatter: URL, title, description, FAQ, фильтр рейтинга)
├── src/components/           ← карточка оператора, рейтинг, оффер, таблицы, FAQ, оглавление…
├── public/img/               ← логотипы операторов, платёжек, устройств, сайта
└── scripts/postbuild.mjs     ← генерирует .htaccess (редиректы /go/) и robots.txt
```

**Карточка оператора** собирается из `operators.json`: лента-бейдж, логотип, место и оценка, плашка бонуса с кнопкой «Obtenir» (реф-ссылка), теги продуктов и статус LONACI, иконки платёжек и устройств, кнопки **Jouer** (реф-ссылка), **Avis** (обзор), **Bonus** (страница промокода), **Appli** (страница приложения). Если у оператора ещё нет своей страницы, кнопка либо ведёт на реф-ссылку, либо скрывается.

**Посадочная = фильтр + текст.** Пример из frontmatter:

```yaml
filter: { "payments": ["orange-money"], "sort": "rating" }
```

Доступные фильтры: `payments`, `sports`, `devices`, `products`, `lonaci`, `has_bonus`, `min_rating`, сортировка `rating | bonus | min_dep`. Список операторов, сравнительные таблицы и числа в тексте («8 sites sur 10») пересчитываются автоматически при изменении `operators.json`.

## Частые действия

| Задача | Что сделать |
|---|---|
| Поменять бонус, промокод, реф-ссылку | Поле в `src/data/operators.json` → сборка |
| Добавить оператора | Новый объект в `operators.json` + логотип в `public/img/operators/` |
| Добавить посадочную | Новый `.mdx` в `src/content/pages/` с `filter` и текстом + строка в `tags` в `meta.json` |
| Страница оператора | `src/content/pages/{оператор}/index.mdx`, `apk.mdx`, `code-promo.mdx`, `inscription.mdx` (URL задаётся полем `path`) |

Локально: `npm install`, затем `npm run dev` (в режиме разработки видны жёлтые блоки «📸 Capture à ajouter» с описанием нужных скриншотов) или `npm run build` (готовый сайт в `dist/`).

## Выкладка

**Вручную:** залить содержимое `dist-upload/` в `public_html/` через файловый менеджер cPanel или FTP. Скрытый файл `.htaccess` обязателен: в нём редиректы `/go/`.

**Автоматически (рекомендуется):** репозиторий в GitHub + файл `.github/workflows/deploy.yml` (уже в исходниках). В GitHub → Settings → Secrets → Actions добавить `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (данные FTP-аккаунта из cPanel). Дальше каждый push в `main` сам собирает сайт и выкладывает его на хостинг.

## Автоматизация (следующий шаг)

С подключённым репозиторием я работаю прямо с файлами сайта: пишу страницы, обновляю офферы, скачиваю логотипы, собираю сайт и проверяю его по скриншотам. Регулярные задачи можно поставить на расписание (например, раз в неделю: проверить офферы и добавить новые страницы). Изменения приходят как pull request: ты одобряешь, и сайт выкладывается сам.

## Что ещё нужно

- [ ] Реф-ссылки и промокоды в `operators.json` (сейчас стоят официальные сайты, у 1win ссылки нет).
- [ ] Плейсхолдеры `[À COMPLÉTER]` на `/a-propos/`, `/contact/`, `/mentions-legales/`.
- [ ] 10 скриншотов для страниц 1xBet: список в поле `shots` во frontmatter каждой страницы.
- [ ] Страницы остальных 9 операторов (шаблон тот же, что у 1xBet).

## Источники данных (проверено 09–12.11.2026)

Ahrefs (CI) — спрос на ключи посадочных и страниц 1xBet; коммюнике LONACI от 08.12.2023 (digitalmag.ci); afrik-foot, basketusa, johnnybet, lebonparisportif, connectionivoirienne — офферы и условия. Логотипы: официальные сайты операторов и платёжек, Wikimedia Commons, whatthelogo, Liquipedia, simple-icons (CC0).
