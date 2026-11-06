import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { login, makeOrderPayload } from './helpers';
import { expectSchema } from './schema';
import {
  adminOrderListSchema,
  errorSchema,
} from './schemas/admin-order.schema';

describe('GET /admin/orders', () => {
  let app: ReturnType<typeof createApp>;
  let admin: string;
  let alice: string; // gold
  let bob: string; // basic

  const createOrder = (token: string) =>
    request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(makeOrderPayload());

  const adminList = () =>
    request(app).get('/admin/orders').set('Authorization', `Bearer ${admin}`);

  beforeEach(async () => {
    app = createApp(); // свіжий стан для кожного тесту
    admin = await login(app, 'admin@example.com');
    alice = await login(app, 'alice@example.com');
    bob = await login(app, 'bob@example.com');
  });

  describe('адміністратор', () => {
    it('бачить замовлення всіх користувачів: 200, схема, значення, заголовок', async () => {
      const a = await createOrder(alice);
      const b = await createOrder(bob);

      const res = await adminList();

      expect(res.status).toBe(200); // рівень 1: код
      expectSchema(res.body, adminOrderListSchema); // рівень 2: структура
      expect(res.body).toHaveLength(2); // рівень 3: значення
      const byId = new Map(
        res.body.map((o: { id: string }) => [o.id, o] as const),
      );
      expect(byId.get(a.body.id)).toMatchObject({
        ownerId: 'u1',
        total: 510, // gold: 500 − 10 % = 450, плюс доставка 60
      });
      expect(byId.get(b.body.id)).toMatchObject({
        ownerId: 'u2',
        total: 560, // basic: 500 + доставка 60
      });
      expect(res.headers['content-type']).toMatch(/application\/json/); // рівень 4
    });

    it('повертає порожній список, якщо замовлень ще немає', async () => {
      const res = await adminList();

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('список відображає створення та видалення замовлень (побічний ефект)', async () => {
      const a = await createOrder(alice);
      const b = await createOrder(bob);
      expect((await adminList()).body).toHaveLength(2);

      await request(app) // власник видаляє своє замовлення
        .delete(`/orders/${b.body.id}`)
        .set('Authorization', `Bearer ${bob}`)
        .expect(204);

      const afterDelete = await adminList(); // рівень 5
      expect(afterDelete.body).toHaveLength(1);
      expect(afterDelete.body[0].id).toBe(a.body.id);

      await createOrder(bob);
      expect((await adminList()).body).toHaveLength(2);
    });

    it('у GET /orders бачить лише власні замовлення', async () => {
      const own = await createOrder(admin);
      await createOrder(bob);

      const res = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${admin}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(own.body.id);
    });

    it('не отримує чужого замовлення за ідентифікатором через /orders/:id', async () => {
      const b = await createOrder(bob);

      const res = await request(app)
        .get(`/orders/${b.body.id}`)
        .set('Authorization', `Bearer ${admin}`);

      expect(res.status).toBe(404); // права адміністратора діють лише в /admin
    });
  });

  describe('звичайний користувач', () => {
    it.each([
      { name: 'basic (bob)', email: 'bob@example.com' },
      { name: 'gold (alice)', email: 'alice@example.com' },
    ])('$name → 403 без жодних даних', async ({ email }) => {
      await createOrder(bob); // дані, які не повинні потрапити до відповіді
      const token = await login(app, email);

      const res = await request(app)
        .get('/admin/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expectSchema(res.body, errorSchema);
      expect(res.body).toEqual({ code: 'FORBIDDEN' }); // без ownerId і замовлень
    });
  });

  describe('без автентифікації', () => {
    it.each([
      { name: 'без токена', header: undefined },
      { name: 'підроблений токен', header: 'Bearer invalid-token' },
      { name: 'без префікса Bearer', header: 'some-token' },
    ])('$name → 401', async ({ header }) => {
      await createOrder(bob);

      const req = request(app).get('/admin/orders');
      if (header) req.set('Authorization', header);
      const res = await req;

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ code: 'UNAUTHORIZED' });
    });
  });
});
