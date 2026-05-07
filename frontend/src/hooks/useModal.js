import { useState } from 'react';

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  const open = (data = null) => {
    setModalData(data);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setModalData(null);
  };

  return {
    isOpen,
    modalData,
    open,
    close
  };
}
