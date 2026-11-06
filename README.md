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
```
