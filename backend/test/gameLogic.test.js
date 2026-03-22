'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { assignRoles, checkGameEnd } = require('../utils/gameLogic');

test('assignRoles: un impostor y dos civiles', () => {
  const players = [
    { id: '1', name: 'a' },
    { id: '2', name: 'b' },
    { id: '3', name: 'c' },
  ];
  const r = assignRoles(players, 'palabra', 1, 'categoría');
  assert.strictEqual(r.length, 3);
  const imps = r.filter((p) => p.role === 'impostor');
  const civs = r.filter((p) => p.role === 'civilian');
  assert.strictEqual(imps.length, 1);
  assert.strictEqual(civs.length, 2);
  imps.forEach((p) => assert.strictEqual(p.word, 'categoría'));
  civs.forEach((p) => assert.strictEqual(p.word, 'palabra'));
});

test('assignRoles: marca hasSeenRole en bots', () => {
  const players = [
    { id: '1', name: 'a', isBot: true },
    { id: '2', name: 'b' },
    { id: '3', name: 'c' },
  ];
  const r = assignRoles(players, 'w', 1, null);
  const bot = r.find((p) => p.isBot);
  assert.ok(bot);
  assert.strictEqual(bot.hasSeenRole, true);
});

test('assignRoles: rechaza impostorCount inválido', () => {
  assert.throws(() =>
    assignRoles(
      [
        { id: '1', name: 'a' },
        { id: '2', name: 'b' },
        { id: '3', name: 'c' },
      ],
      'w',
      3,
      null
    )
  );
});

test('assignRoles: rechaza menos de 3 jugadores', () => {
  assert.throws(() =>
    assignRoles(
      [
        { id: '1', name: 'a' },
        { id: '2', name: 'b' },
      ],
      'w',
      1,
      null
    )
  );
});

test('checkGameEnd: civiles ganan si no quedan impostores activos', () => {
  const end = checkGameEnd({
    players: [
      { id: '1', role: 'civilian' },
      { id: '2', role: 'impostor' },
    ],
    eliminatedPlayers: ['2'],
  });
  assert.strictEqual(end.finished, true);
  assert.strictEqual(end.winner, 'civilians');
});

test('checkGameEnd: impostores ganan si igualan o superan a civiles activos', () => {
  const end = checkGameEnd({
    players: [
      { id: '1', role: 'impostor' },
      { id: '2', role: 'civilian' },
    ],
    eliminatedPlayers: [],
  });
  assert.strictEqual(end.finished, true);
  assert.strictEqual(end.winner, 'impostors');
});

test('checkGameEnd: continúa si hay ambos bandos', () => {
  const end = checkGameEnd({
    players: [
      { id: '1', role: 'impostor' },
      { id: '2', role: 'civilian' },
      { id: '3', role: 'civilian' },
    ],
    eliminatedPlayers: [],
  });
  assert.strictEqual(end.finished, false);
  assert.strictEqual(end.winner, null);
});
