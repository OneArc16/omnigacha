import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ADMIN_EDITOR_GRID_CLASSNAME,
  ADMIN_PANEL_HERO_GRID_CLASSNAME,
  ADMIN_SUMMARY_FOOTER_GRID_CLASSNAME,
  ADMIN_SUMMARY_METRICS_GRID_CLASSNAME,
  getAdminBackdropClassName,
  getAdminShellClassName,
} from './admin-layout';

test('wide admin shell uses the full viewport width without centering wrappers', () => {
  const className = getAdminShellClassName('wide');

  assert.ok(className.includes('w-full'));
  assert.ok(className.includes('xl:px-10'));
  assert.ok(!className.includes('mx-auto'));
  assert.ok(!className.includes('max-w-'));
});

test('compact admin shell remains left aligned while keeping helper states readable', () => {
  const className = getAdminShellClassName('compact');

  assert.ok(className.includes('max-w-[76rem]'));
  assert.ok(!className.includes('mx-auto'));
});

test('admin backdrops keep a richer hero state and a calmer compact state', () => {
  const heroBackdrop = getAdminBackdropClassName('hero');
  const compactBackdrop = getAdminBackdropClassName('compact');

  assert.ok(heroBackdrop.includes('h-[30rem]'));
  assert.ok(compactBackdrop.includes('h-[24rem]'));
  assert.notEqual(heroBackdrop, compactBackdrop);
});

test('admin layout grids scale into multi-column compositions on wide screens', () => {
  assert.ok(ADMIN_PANEL_HERO_GRID_CLASSNAME.includes('2xl:grid-cols-'));
  assert.ok(ADMIN_EDITOR_GRID_CLASSNAME.includes('2xl:grid-cols-'));
  assert.ok(ADMIN_SUMMARY_METRICS_GRID_CLASSNAME.includes('2xl:grid-cols-5'));
  assert.ok(
    ADMIN_SUMMARY_FOOTER_GRID_CLASSNAME.includes('2xl:grid-cols-'),
  );
});
