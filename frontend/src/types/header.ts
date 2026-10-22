export interface HeaderProps {
  onToggleSidebar?: () => void;
  collapsed?: boolean;
  isMobile?: boolean;
}

export interface UserDropdownItem {
  key: string;
  label: string;
  icon: string;
  danger?: boolean;
  onClick: () => void;
}
