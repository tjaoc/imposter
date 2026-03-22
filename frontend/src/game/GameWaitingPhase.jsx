import { memo } from 'react';
import { m } from 'framer-motion';
import PageNav from '../components/PageNav';
import { useMotionReduce, tx } from './motionReduce';

function GameWaitingPhase ({
  t,
  code,
  gamePhase,
  myRole,
  isConnected,
  navigate,
  handleBackToLobby,
}) {
  const reduce = useMotionReduce();

  return (
    <div className="min-h-full flex flex-col p-4">
      <PageNav showBack onBack={() => navigate(-1)} onExit={handleBackToLobby} />
      <div className="flex-1 flex items-center justify-center">
        <m.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={tx(reduce, undefined)}
          className="text-center"
        >
          <div className="animate-pulse text-space-cyan text-xl mb-4">
            {t('game.waitingHost')}
          </div>
          <div className="text-gray-400 text-sm">Sala: {code}</div>
          <div className="text-sm text-gray-500 mt-4">
            Debug: Phase={gamePhase} | Role={myRole ? '✅' : '❌'} | Connected=
            {isConnected ? '✅' : '❌'}
          </div>
        </m.div>
      </div>
    </div>
  );
}

export default memo(GameWaitingPhase);
