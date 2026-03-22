import { describe, it, expect } from 'vitest';
import { assignRoles, checkGameEnd, processVotes } from './localGameLogic';

describe('localGameLogic', () => {
  it('assignRoles: reparte un impostor y palabras coherentes', () => {
    const players = [
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
      { id: '3', name: 'c' },
    ];
    const r = assignRoles(players, 'secreto', 1, 'pista');
    expect(r).toHaveLength(3);
    expect(r.filter((p) => p.role === 'impostor')).toHaveLength(1);
    expect(r.filter((p) => p.role === 'civilian')).toHaveLength(2);
    r.forEach((p) => {
      if (p.role === 'impostor') expect(p.word).toBe('pista');
      else expect(p.word).toBe('secreto');
    });
  });

  it('checkGameEnd: sin impostores activos → civiles', () => {
    const end = checkGameEnd({
      players: [
        { id: '1', role: 'civilian' },
        { id: '2', role: 'impostor' },
      ],
      eliminatedPlayers: ['2'],
    });
    expect(end.finished).toBe(true);
    expect(end.winner).toBe('civilians');
  });

  it('processVotes: mayoría simple elimina jugador', () => {
    const gameState = {
      players: [
        { id: '1', role: 'civilian' },
        { id: '2', role: 'civilian' },
        { id: '3', role: 'impostor' },
      ],
      eliminatedPlayers: [],
    };
    const votes = { 1: '3', 2: '3' };
    const out = processVotes(gameState, votes);
    expect(out.isTie).toBe(false);
    expect(out.eliminated?.id).toBe('3');
  });
});
