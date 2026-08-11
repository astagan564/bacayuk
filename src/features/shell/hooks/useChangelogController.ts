import { useCallback, useState } from 'react';
import packageJson from '../../../../package.json';

const LAST_SEEN_VERSION_KEY = 'bacayuk_last_seen_version';

export function useChangelogController() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasUnreadChangelog, setHasUnreadChangelog] = useState(
    () => localStorage.getItem(LAST_SEEN_VERSION_KEY) !== packageJson.version,
  );

  const toggleDropdown = useCallback((): void => {
    setIsDropdownOpen((isOpen) => !isOpen);
    if (hasUnreadChangelog) {
      localStorage.setItem(LAST_SEEN_VERSION_KEY, packageJson.version);
      setHasUnreadChangelog(false);
    }
  }, [hasUnreadChangelog]);
  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);
  const openModal = useCallback(() => {
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  }, []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return {
    isModalOpen,
    isDropdownOpen,
    hasUnreadChangelog,
    toggleDropdown,
    closeDropdown,
    openModal,
    closeModal,
  };
}

export type ChangelogController = ReturnType<typeof useChangelogController>;
