export interface SidebarItem {
  key: string;
  icon: string;
  label: string;
  disabled?: boolean;
}

export interface SidebarGroup {
  id: string;
  label: string;
  icon: string;
  collapsible: boolean;
  disabled?: boolean;
  isSearchMatch?: boolean;
  items: SidebarItem[];
}

export interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}
