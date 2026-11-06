# qa-api-lab — тестування REST API (лабораторна № 5)

Навчальний сервіс замовлень (Express) і автоматизовані тести API:
Supertest, JSON Schema (Ajv), Postman і Newman.

## Запуск

```bash
npm install
npm start          # сервер на http://localhost:3000
npm test           # тести Vitest + Supertest (сервер запускати не потрібно)
npm run newman     # колекція Postman (потрібен запущений сервер)
```

## Структура

```
src/app.ts                    # фабрика createApp() — застосунок із порожнім станом
src/server.ts                 # ручний запуск (для Postman)
tests/orders.test.ts          # тести POST/GET/DELETE /orders, доступ, схема
tests/helpers.ts              # login, makeOrderPayload
tests/schema.ts               # expectSchema (Ajv, allErrors)
tests/schemas/order.schema.ts # схема відповіді (additionalProperties: false)
postman/                      # колекція Postman для Newman
tests/admin-orders.test.ts    # варіант 10: GET /admin/orders
tests/schemas/admin-order.schema.ts
```

## Варіант 10: роль адміністратора

`GET /admin/orders` повертає **всі** замовлення (з полем `ownerId`).

| Запит | Результат |
| --- | --- |
| адміністратор (`admin@example.com`) | `200`, масив усіх замовлень |
| звичайний користувач | `403 { code: 'FORBIDDEN' }` |
| без токена, підроблений токен, без `Bearer` | `401 { code: 'UNAUTHORIZED' }` |

Облікові записи (пароль `Secret123`): `alice@example.com` (gold),
`bob@example.com` (basic), `admin@example.com` (адміністратор).
