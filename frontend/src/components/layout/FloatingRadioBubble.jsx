import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Radio, Music } from 'lucide-react';
import './FloatingRadioBubble.scss';

export function FloatingRadioBubble() {
  const navigate = useNavigate();
  const location = useLocation();
  const bubbleRef = useRef(null);
  
  // Track dragging state
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('floating_radio_pos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    // Default position: floating on the left side, above the bottom corner
    return { x: 305, y: window.innerHeight - 100 };
  });

  const [isHovered, setIsHovered] = useState(false);
  const isDragActive = useRef(false);

  // Handle window resizing to keep the bubble within screen bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const nextX = Math.max(10, Math.min(window.innerWidth - 65, prev.x));
        const nextY = Math.max(10, Math.min(window.innerHeight - 65, prev.y));
        return { x: nextX, y: nextY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStart = (clientX, clientY) => {
    isDragActive.current = false;
    const startX = clientX;
    const startY = clientY;
    const initX = position.x;
    const initY = position.y;

    const handleMove = (moveEvent) => {
      const touch = moveEvent.touches && moveEvent.touches[0];
      const currentX = touch ? touch.clientX : moveEvent.clientX;
      const currentY = touch ? touch.clientY : moveEvent.clientY;
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      // If dragged more than 5px, it is considered a drag not a click
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        isDragActive.current = true;
      }

      // Viewport bounds limits
      let nextX = initX + deltaX;
      let nextY = initY + deltaY;

      nextX = Math.max(10, Math.min(window.innerWidth - 65, nextX));
      nextY = Math.max(10, Math.min(window.innerHeight - 65, nextY));

      setPosition({ x: nextX, y: nextY });
    };

    const handleEnd = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);

      // Save position to localStorage
      if (isDragActive.current) {
        localStorage.setItem('floating_radio_pos', JSON.stringify(position));
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only drag with left mouse button
    handleStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleClick = (e) => {
    // If we were dragging, do not navigate
    if (isDragActive.current) {
      e.preventDefault();
      return;
    }
    
    // Navigate to /radio page
    navigate('/radio');
  };

  // Do not show bubble if already on the /radio page
  if (location.pathname === '/radio') {
    return null;
  }

  return (
    <div
      ref={bubbleRef}
      className={`floating-radio-bubble ${isHovered ? 'hovered' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Buka Radio & Musik (Seret untuk geser)"
    >
      <div className="bubble-inner">
        <Radio className="radio-icon" size={24} />
        <Music className="music-note-decor" size={12} />
      </div>
      <div className="bubble-glow"></div>
      
      {isHovered && (
        <div className="bubble-tooltip">
          <span>Radio & Musik 🎵</span>
          <span className="tooltip-action">Klik untuk buka / Seret untuk geser</span>
        </div>
      )}
    </div>
  );
}
