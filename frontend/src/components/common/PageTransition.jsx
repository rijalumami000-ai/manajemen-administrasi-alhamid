import React, { useEffect, useState } from 'react';
import './PageTransition.scss';

const PageTransition = ({ children, type = 'fade' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  const getTransitionClass = () => {
    switch (type) {
      case 'fade':
        return 'page-transition-fade';
      case 'slide-up':
        return 'page-transition-slide-up';
      case 'slide-down':
        return 'page-transition-slide-down';
      case 'slide-left':
        return 'page-transition-slide-left';
      case 'slide-right':
        return 'page-transition-slide-right';
      case 'scale':
        return 'page-transition-scale';
      default:
        return 'page-transition-fade';
    }
  };

  return (
    <div className={`page-transition ${getTransitionClass()} ${isVisible ? 'is-visible' : ''}`}>
      {children}
    </div>
  );
};

export default PageTransition;
