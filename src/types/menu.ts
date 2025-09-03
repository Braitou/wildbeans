export type ModifierType = 'single' | 'multi';

export type ModifierOption = { id: string; name: string };
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
