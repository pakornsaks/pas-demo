import type { LucideIcon } from 'lucide-react';

export interface SubNavItem {
  id: string;
  title: string;
  href: string;
  badge?: string | number;
}

export interface NavItem {
  id: string;
  title: string;
  href?: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: SubNavItem[];
}

export interface NavSection {
  sectionTitle?: string;
  items: NavItem[];
}