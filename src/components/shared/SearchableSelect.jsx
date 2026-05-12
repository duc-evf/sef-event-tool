import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function SearchableSelect({ options, value = [], onChange, placeholder = 'Search and select...' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(q));
  }, [options, search]);

  const toggle = (item) => {
    const next = value.includes(item) ? value.filter(v => v !== item) : [...value, item];
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(''); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start h-auto min-h-10 font-normal">
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
      <PopoverContent className="w-80 p-2" align="start">
        <Input
          placeholder="Type to filter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
          autoFocus
        />
        <div className="max-h-60 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground px-2 py-1">No matches</div>
          )}
          {filtered.map(opt => (
            <div
              key={opt}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm hover:bg-accent',
                value.includes(opt) && 'bg-accent'
              )}
              onClick={() => toggle(opt)}
            >
              <div className={cn(
                'w-4 h-4 border rounded flex items-center justify-center text-xs shrink-0',
                value.includes(opt) ? 'bg-primary text-primary-foreground border-primary' : 'border-input'
              )}>
                {value.includes(opt) && '✓'}
              </div>
              <span className="truncate">{opt}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
