import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export default function DataTable({ columns, data, onEdit, onDelete, requiredFields = [] }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [selected, setSelected] = useState(new Set());

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortCol) return 0;
    const av = a[sortCol] || '';
    const bv = b[sortCol] || '';
    const cmp = String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleAll = () => {
    if (selected.size === data.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.map(d => d.id)));
    }
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const isIncomplete = (row) => requiredFields.some(f => !row[f]);

  const handleBulkDelete = () => {
    if (selected.size > 0 && onDelete) {
      onDelete([...selected]);
      setSelected(new Set());
    }
  };

  return (
    <div>
      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>Delete selected</Button>
        </div>
      )}
      <div className="border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={data.length > 0 && selected.size === data.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  className="cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortCol === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </TableHead>
              ))}
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center text-muted-foreground py-8">
                  No data yet
                </TableCell>
              </TableRow>
            )}
            {sorted.map(row => (
              <TableRow
                key={row.id}
                className={cn(isIncomplete(row) && 'bg-yellow-50 dark:bg-yellow-950/20')}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={() => toggleOne(row.id)}
                  />
                </TableCell>
                {columns.map(col => (
                  <TableCell key={col.key} className="max-w-48 truncate">
                    {col.render ? col.render(row[col.key], row) : (
                      Array.isArray(row[col.key]) ? row[col.key].join(', ') : row[col.key]
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit?.(row)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete?.([row.id])}>
                      Del
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
