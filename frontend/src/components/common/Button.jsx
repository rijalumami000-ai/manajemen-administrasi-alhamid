export function Button({
  children,
  variant = 'primary',
  onClick,
  disabled,
  type = 'button',
  className = '',
  ...props
}) {
  const variantClass = variant === 'secondary' ? 'button-secondary' : 'button';

  return (
    <button
      type={type}
      className={`${variantClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
