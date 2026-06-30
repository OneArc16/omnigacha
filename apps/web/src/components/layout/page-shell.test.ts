import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAppBackdropClassName,
  getAppShellClassName,
  SIMULATOR_HERO_GRID_CLASSNAME,
  SIMULATOR_HISTORY_GRID_CLASSNAME,
  SIMULATOR_RECOMMEND_GRID_CLASSNAME,
  SIMULATOR_SCENARIO_GRID_CLASSNAME,
  WORKSPACE_ACCOUNT_GRID_CLASSNAME,
  WORKSPACE_HERO_GRID_CLASSNAME,
  WORKSPACE_OVERVIEW_GRID_CLASSNAME,
  WORKSPACE_ROSTER_GRID_CLASSNAME,
} from './page-shell';

test('wide app shells use the full width without centered max-width wrappers', () => {
  const className = getAppShellClassName('wide');

  assert.ok(className.includes('w-full'));
  assert.ok(className.includes('2xl:px-12'));
  assert.ok(!className.includes('mx-auto'));
  assert.ok(!className.includes('max-w-'));
});

test('compact app shells keep readable states without recentring the screen', () => {
  const className = getAppShellClassName('compact');

  assert.ok(className.includes('max-w-[76rem]'));
  assert.ok(!className.includes('mx-auto'));
});

test('workspace and simulator backdrops remain distinct from compact fallback states', () => {
  const workspaceBackdrop = getAppBackdropClassName('workspace');
  const simulatorBackdrop = getAppBackdropClassName('simulator');
  const compactBackdrop = getAppBackdropClassName('compact');

  assert.notEqual(workspaceBackdrop, simulatorBackdrop);
  assert.notEqual(simulatorBackdrop, compactBackdrop);
  assert.ok(workspaceBackdrop.includes('h-[30rem]'));
  assert.ok(simulatorBackdrop.includes('h-[30rem]'));
  assert.ok(compactBackdrop.includes('h-[24rem]'));
});

test('workspace grids scale into broader desktop compositions', () => {
  assert.ok(WORKSPACE_HERO_GRID_CLASSNAME.includes('2xl:grid-cols-'));
  assert.ok(WORKSPACE_OVERVIEW_GRID_CLASSNAME.includes('2xl:grid-cols-'));
  assert.ok(WORKSPACE_ROSTER_GRID_CLASSNAME.includes('2xl:grid-cols-'));
  assert.ok(WORKSPACE_ACCOUNT_GRID_CLASSNAME.includes('2xl:grid-cols-'));
});

test('simulator grids keep wide-screen space available across its main flows', () => {
  assert.ok(SIMULATOR_HERO_GRID_CLASSNAME.includes('2xl:grid-cols-'));
  assert.ok(SIMULATOR_RECOMMEND_GRID_CLASSNAME.includes('2xl:grid-cols-'));
  assert.ok(SIMULATOR_SCENARIO_GRID_CLASSNAME.includes('2xl:grid-cols-'));
  assert.ok(SIMULATOR_HISTORY_GRID_CLASSNAME.includes('2xl:grid-cols-'));
});
