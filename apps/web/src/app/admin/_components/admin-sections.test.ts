import assert from 'node:assert/strict';
import { test } from 'vitest';
import { ADMIN_SECTIONS, resolveActiveAdminHref } from './admin-sections';

test('admin sections expose unique routes under /admin', () => {
  const hrefs = ADMIN_SECTIONS.map((section) => section.href);

  assert.equal(new Set(hrefs).size, hrefs.length);
  assert.ok(hrefs.every((href) => href === '/admin' || href.startsWith('/admin/')));
});

test('resolveActiveAdminHref marks the summary only on the exact /admin route', () => {
  assert.equal(resolveActiveAdminHref('/admin'), '/admin');
  assert.equal(resolveActiveAdminHref('/admin/unknown'), null);
});

test('resolveActiveAdminHref matches a section and its nested routes', () => {
  assert.equal(resolveActiveAdminHref('/admin/users'), '/admin/users');
  assert.equal(
    resolveActiveAdminHref('/admin/catalog/characters/12'),
    '/admin/catalog/characters',
  );
});

test('resolveActiveAdminHref ignores routes outside admin', () => {
  assert.equal(resolveActiveAdminHref('/'), null);
  assert.equal(resolveActiveAdminHref('/simulator'), null);
});
