export type ModifierType = 'single' | 'multi';

export type ModifierOption = {
  id: string;
  name: string;
};

export type Modifier = {
  id: string;
  name: string;
  type: ModifierType;
  required: boolean;
  options: ModifierOption[];
};

export type Item = {
  id: string;
  name: string;
  description?: string | null;
  modifiers: Modifier[];
};

export type Category = {
  id: string;
  name: string;
  items: Item[];
};

export type Event = {
  id: string;
  name: string;
  slug: string;
  join_code: string;
  kitchen_code: string;
  starts_at?: string | null;
  ends_at?: string | null;
  is_closed?: boolean;
  display_name?: string | null;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
};