import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
  ADMIN_EDITOR_GRID_CLASSNAME,
  ADMIN_MEDIA_GRID_CLASSNAME,
} from './admin-layout';

test('admin editor pairs a fixed list column with a fluid editor on wide screens', () => {
  assert.ok(
    ADMIN_EDITOR_GRID_CLASSNAME.includes('xl:grid-cols-[400px_minmax(0,1fr)]'),
  );
  assert.ok(ADMIN_EDITOR_GRID_CLASSNAME.includes('items-start'));
});

test('admin media slots sit side by side only when there is room', () => {
  assert.ok(ADMIN_MEDIA_GRID_CLASSNAME.includes('lg:grid-cols-2'));
});
