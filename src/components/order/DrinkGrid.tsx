'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Item } from '@/lib/types';

interface DrinkGridProps {
  categories: {
    id: string;
    name: string;
    items: Item[];
  }[];
  onSelectItem: (item: Item) => void;
}

export default function DrinkGrid({ categories, onSelectItem }: DrinkGridProps) {
  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <div key={category.id}>
          <h2 className="mb-4 text-lg font-semibold uppercase tracking-widest text-muted-foreground">
            {category.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.items.map((item) => (
              <Card 
                key={item.id} 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-card/50 border-border/50"
                onClick={() => onSelectItem(item)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium uppercase tracking-wide">
                    {item.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {item.modifiers.length > 0 && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      {item.modifiers.length} option{item.modifiers.length > 1 ? 's' : ''} disponible{item.modifiers.length > 1 ? 's' : ''}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
