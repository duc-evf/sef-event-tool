import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function MultiSelect({ options, value = [], onChange, placeholder = 'Select...', className }) {
  const [open, setOpen] = useState(false);

  const toggle = (item) => {
    const next = value.includes(item) ? value.filter(v => v !== item) : [...value, item];
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('w-full justify-start h-auto min-h-10 font-normal', className)}>
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.map(v => (
                <Badge key={v} variant="secondary" className="text-xs">
                  {v}
                  <span
                    className="ml-1 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); toggle(v); }}
                  >
                    ×
                  </span>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-2 max-h-60 overflow-y-auto" align="start">
        {options.map(opt => (
          <div
            key={opt}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm hover:bg-accent',
              value.includes(opt) && 'bg-accent'
            )}
            onClick={() => toggle(opt)}
          >
            <div className={cn(
              'w-4 h-4 border rounded flex items-center justify-center text-xs',
              value.includes(opt) ? 'bg-primary text-primary-foreground border-primary' : 'border-input'
            )}>
              {value.includes(opt) && '✓'}
            </div>
            {opt}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
