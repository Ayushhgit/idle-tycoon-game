import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function useOfflineEarnings() {
  const showOfflineModal = useGameStore((s) => s.showOfflineModal);
  const offlineEarnings = useGameStore((s) => s.offlineEarnings);
  const setShowOfflineModal = useGameStore((s) => s.setShowOfflineModal);
  const setOfflineEarnings = useGameStore((s) => s.setOfflineEarnings);

  const claimOfflineEarnings = () => {
    setOfflineEarnings(offlineEarnings);
  };

  return {
    showOfflineModal,
    offlineEarnings,
    claimOfflineEarnings,
    dismissOfflineModal: () => setShowOfflineModal(false),
  };
}
