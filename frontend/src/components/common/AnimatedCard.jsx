import React from 'react';
import { Card } from 'antd';
import './AnimatedCard.scss';

const AnimatedCard = ({
  children,
  hoverable = true,
  effect = 'lift',
  className = '',
  ...props
}) => {
  const getEffectClass = () => {
    switch (effect) {
      case 'lift':
        return 'animated-card-lift';
      case 'scale':
        return 'animated-card-scale';
      case 'glow':
        return 'animated-card-glow';
      case 'border':
        return 'animated-card-border';
      case 'shadow':
        return 'animated-card-shadow';
      default:
        return 'animated-card-lift';
    }
  };

  return (
    <Card
      hoverable={hoverable}
      className={`animated-card ${getEffectClass()} ${className}`}
      {...props}
    >
      {children}
    </Card>
  );
};

export default AnimatedCard;
