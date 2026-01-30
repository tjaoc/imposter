import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { processVotes, checkGameEnd } from '../utils/localGameLogic';
import { capitalizeWord } from '../utils/formatWord';

const DEFAULT_DISCUSSION_SECONDS = 240;

function LocalGame() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const gameStateFromLocation = location.state?.gameState;

  const [phase, setPhase] = useState('discussion'); // discussion | voting-turn | vote-results | results
  const [players, setPlayers] = useState([]);
  const [secretWord, setSecretWord] = useState('');
  const [discussionEndsAt, setDiscussionEndsAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [votes, setVotes] = useState({});
  const [selectedVote, setSelectedVote] = useState(null);
  const [eliminatedPlayers, setEliminatedPlayers] = useState([]);
  const [voteResult, setVoteResult] = useState(null);
  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    if (!gameStateFromLocation?.players?.length) {
      navigate('/local', { replace: true });
      return;
    }
    setPlayers(gameStateFromLocation.players);
    setSecretWord(gameStateFromLocation.secretWord || '');
    setEliminatedPlayers(gameStateFromLocation.eliminatedPlayers || []);
    const duration =
      (gameStateFromLocation.discussionSeconds || DEFAULT_DISCUSSION_SECONDS) *
      1000;
    setDiscussionEndsAt(Date.now() + duration);
    setTimeLeft(Math.floor(duration / 1000));
  }, [gameStateFromLocation, navigate]);

  useEffect(() => {
    if (phase !== 'discussion' || !discussionEndsAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((discussionEndsAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [phase, discussionEndsAt]);

  const currentVoter = players[currentVoterIndex];
  const activePlayersForVote = players.filter(
    (p) => !eliminatedPlayers.includes(p.id) && p.id !== currentVoter?.id
  );

  const handleStartVoting = () => {
    setPhase('voting-turn');
    setCurrentVoterIndex(0);
    setSelectedVote(null);
    setVotes({});
  };

  const handleVote = (playerId) => {
    if (!currentVoter) return;
    const newVotes = { ...votes, [currentVoter.id]: playerId };
    setVotes(newVotes);
    setSelectedVote(playerId);
  };

  const handleConfirmVoteAndNext = () => {
    if (currentVoterIndex >= players.length - 1) {
      const gs = { players, eliminatedPlayers, votes };
      const result = processVotes(gs, {
        ...votes,
        [currentVoter.id]: selectedVote,
      });
      const finalVotes = { ...votes, [currentVoter.id]: selectedVote };
      const votesWithNames = Object.fromEntries(
        players.map((p) => [
          p.id,
          {
            votedId: finalVotes[p.id],
            votedName: players.find((x) => x.id === finalVotes[p.id])?.name,
          },
        ])
      );
      setVoteResult({
        ...result,
        players,
        impostor: players.find((p) => p.role === 'impostor'),
        secretWord,
        votesWithNames,
        impostorDiscovered: result.eliminated?.role === 'impostor',
      });
      const newEliminated = result.eliminated
        ? [...eliminatedPlayers, result.eliminated.id]
        : eliminatedPlayers;
      setEliminatedPlayers(newEliminated);
      const endCheck = checkGameEnd({
        players,
        eliminatedPlayers: newEliminated,
      });
      if (endCheck.finished) {
        setGameResult({
          winner: endCheck.winner,
          secretWord,
          eliminated: result.eliminated,
          players,
          votesWithNames,
          impostorDiscovered: result.eliminated?.role === 'impostor',
        });
        setPhase('results');
      } else {
        setPhase('vote-results');
      }
      return;
    }
    setVotes((prev) => ({ ...prev, [currentVoter.id]: selectedVote }));
    setSelectedVote(null);
    setCurrentVoterIndex((i) => i + 1);
  };

  if (!gameStateFromLocation) return null;

  if (phase === 'discussion') {
    const minutes = Math.floor((timeLeft ?? 0) / 60);
    const secs = (timeLeft ?? 0) % 60;
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-14 md:pt-20 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-glow mb-4">
              💬 {t('game.discussion')}
            </h1>
            <div className="text-7xl font-bold text-space-cyan mb-4">
              {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <p className="text-gray-400 text-lg">
              {t('game.discussAndDiscover')}
            </p>
          </div>
          <div className="glass-effect rounded-2xl p-6 mb-6">
            <p className="text-gray-300 text-center">
              {t('local.discussionReminder')}
            </p>
          </div>
          <button
            onClick={handleStartVoting}
            className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {timeLeft === 0
              ? t('game.timeUpStartVoting')
              : `🗳️ ${t('game.startVoting')}`}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full mt-6 py-3 text-gray-400 hover:text-white"
          >
            {t('game.backToHome')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'voting-turn' && currentVoter) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-14 md:pt-20 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="max-w-2xl mx-auto">
          <p className="text-space-cyan/60 text-sm uppercase tracking-widest mb-4 text-center">
            {t('local.securityScreen')}
          </p>
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            {t('local.passPhoneTo')}{' '}
            <span className="text-glow">{currentVoter.name}</span>
          </h1>
          <p className="text-gray-400 text-center mb-6">
            {t('game.whoIsImpostor')}
          </p>
          <div className="space-y-3 mb-6">
            {activePlayersForVote.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleVote(p.id)}
                className={`w-full p-4 rounded-xl border-2 flex items-center justify-between ${
                  selectedVote === p.id
                    ? 'border-emerald-400 bg-emerald-500/20'
                    : 'border-space-blue bg-space-blue/50'
                }`}
              >
                <span className="text-white font-semibold">{p.name}</span>
                {selectedVote === p.id && (
                  <span className="text-emerald-400">✓</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={handleConfirmVoteAndNext}
            disabled={!selectedVote}
            className="w-full min-h-[52px] py-4 rounded-full bg-gradient-to-r from-space-purple to-space-pink font-semibold text-white disabled:opacity-50 active:scale-[0.98]"
          >
            {t('common.next')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'vote-results' && voteResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 pt-14 md:pt-20 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="glass-effect rounded-3xl p-8 max-w-2xl w-full text-center">
          <h1 className="text-4xl font-bold text-space-cyan mb-6">
            🗳️ {t('game.voteResults')}
          </h1>
          {voteResult.eliminated && (
            <p className="text-emerald-300 font-semibold mb-4">
              {t('game.impostorDiscovered')}: {voteResult.eliminated.name}
            </p>
          )}
          <p className="text-red-300 font-semibold mb-4">
            {t('game.impostorWas')} {voteResult.impostor?.name}
          </p>
          {/* Quién votó a quién; el impostor solo nombre + "Impostor" */}
          {voteResult.votesWithNames && voteResult.players?.length > 0 && (
            <div className="mb-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-3 text-center">
                {t('game.votes')}
              </h3>
              <div className="space-y-2">
                {voteResult.players.map((p) => {
                  const isImpostor = p.role === 'impostor';
                  const voteInfo = voteResult.votesWithNames[p.id];
                  const votedForImpostor =
                    !isImpostor &&
                    voteResult.impostor &&
                    voteInfo?.votedId === voteResult.impostor.id;
                  const didNotVoteForImpostor =
                    !isImpostor &&
                    voteInfo?.votedId &&
                    voteResult.impostor &&
                    voteInfo.votedId !== voteResult.impostor.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-lg flex items-center justify-between ${
                        isImpostor
                          ? 'bg-yellow-500/20 border border-yellow-500/50'
                          : votedForImpostor
                          ? 'bg-emerald-500/20 border border-emerald-500/50'
                          : didNotVoteForImpostor
                          ? 'bg-red-500/20 border border-red-500/50'
                          : 'bg-gray-800/50 border border-gray-700/50'
                      }`}
                    >
                      <span className="text-white font-medium">{p.name}</span>
                      <div className="flex items-center gap-2">
                        {isImpostor ? (
                          <span className="text-yellow-400 font-semibold">
                            🕵️ {t('game.impostorLabel')}
                          </span>
                        ) : voteInfo?.votedName ? (
                          <>
                            <span
                              className={`font-semibold ${
                                votedForImpostor
                                  ? 'text-emerald-400'
                                  : didNotVoteForImpostor
                                  ? 'text-red-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              {t('game.votedFor', { name: voteInfo.votedName })}
                            </span>
                            {votedForImpostor && (
                              <span className="text-emerald-300 text-sm">
                                ✓ {t('game.correct')}
                              </span>
                            )}
                            {didNotVoteForImpostor && (
                              <span className="text-red-300 text-sm">
                                ✗ {t('game.wrong')}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">
                            {t('game.noVote')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <button
            onClick={() =>
              navigate('/local', {
                state: {
                  keepPlayers: voteResult.players.map((p) => ({
                    id: p.id,
                    name: p.name,
                  })),
                },
              })
            }
            className="w-full mt-4 py-3 rounded-xl font-semibold text-white bg-space-blue border border-space-cyan/50 hover:bg-space-cyan/20"
          >
            🎮 {t('game.newGame')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 py-3 text-gray-400 hover:text-white"
          >
            {t('game.backToHome')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'results' && gameResult) {
    const impostorsWon = gameResult.winner === 'impostors';

    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 pt-14 md:pt-20 bg-gradient-to-b from-black via-slate-950 to-black">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-effect rounded-3xl p-8 max-w-2xl w-full text-center"
        >
          <div className="text-9xl mb-4">{impostorsWon ? '🕵️' : '🎯'}</div>
          <h1
            className={`text-5xl font-bold mb-6 ${
              gameResult.winner === 'impostors'
                ? 'text-red-400'
                : 'text-emerald-400'
            }`}
          >
            {gameResult.winner === 'impostors'
              ? t('game.impostorsWin')
              : t('game.civiliansWin')}
          </h1>
          <p className="text-2xl text-space-cyan mb-6">
            {t('game.secretWordWas')}{' '}
            <span className="font-bold text-emerald-400">
              {capitalizeWord(gameResult.secretWord)}
            </span>
          </p>
          {gameResult.eliminated && (
            <p className="text-gray-300 mb-4">
              {gameResult.eliminated.name} {t('game.eliminated')}
            </p>
          )}
          {/* Quién votó a quién; verde = acertó, rojo = no acertó */}
          {gameResult.votesWithNames && gameResult.players?.length > 0 && (
            <div className="mb-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-3 text-center">
                {t('game.votes')}
              </h3>
              <div className="space-y-2">
                {gameResult.players.map((p) => {
                  const isImpostor = p.role === 'impostor';
                  const voteInfo = gameResult.votesWithNames[p.id];
                  const impostor = gameResult.players?.find(
                    (x) => x.role === 'impostor'
                  );
                  const votedForImpostor =
                    !isImpostor &&
                    impostor &&
                    voteInfo?.votedId === impostor.id;
                  const didNotVoteForImpostor =
                    !isImpostor &&
                    voteInfo?.votedId &&
                    impostor &&
                    voteInfo.votedId !== impostor.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-lg flex items-center justify-between ${
                        isImpostor
                          ? 'bg-red-500/10 border border-red-500/30'
                          : votedForImpostor
                          ? 'bg-emerald-500/20 border border-emerald-500/50'
                          : didNotVoteForImpostor
                          ? 'bg-red-500/20 border border-red-500/50'
                          : 'bg-gray-800/50 border border-gray-700/50'
                      }`}
                    >
                      <span className="text-white font-medium">{p.name}</span>
                      <div className="flex items-center gap-2">
                        {isImpostor ? (
                          <span className="text-red-400 font-semibold">
                            🕵️ {t('game.impostorLabel')}
                          </span>
                        ) : voteInfo?.votedName ? (
                          <>
                            <span
                              className={`font-semibold ${
                                votedForImpostor
                                  ? 'text-emerald-400'
                                  : didNotVoteForImpostor
                                  ? 'text-red-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              {t('game.votedFor', { name: voteInfo.votedName })}
                            </span>
                            {votedForImpostor && (
                              <span className="text-emerald-300 text-sm">
                                ✓ {t('game.correct')}
                              </span>
                            )}
                            {didNotVoteForImpostor && (
                              <span className="text-red-300 text-sm">
                                ✗ {t('game.wrong')}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">
                            {t('game.noVote')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <button
            onClick={() => {
              navigate('/local', {
                state: {
                  keepPlayers: gameResult.players.map((p) => ({
                    id: p.id,
                    name: p.name,
                  })),
                },
              });
            }}
            className="w-full min-h-[52px] py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl font-bold text-white mb-4 active:scale-[0.98]"
          >
            🎮 {t('game.newGame')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full min-h-[52px] py-4 bg-gradient-to-r from-space-purple to-space-pink rounded-xl font-bold text-white active:scale-[0.98]"
          >
            {t('game.backToHome')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 pt-14 md:pt-20">
      <p className="text-space-cyan">{t('common.loading')}</p>
    </div>
  );
}

export default LocalGame;
