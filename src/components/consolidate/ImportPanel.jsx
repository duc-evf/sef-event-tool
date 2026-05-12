import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ImportPanel({ submissions, onImport, onClear }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const processFiles = useCallback(async (files) => {
    setError('');
    const newSubmissions = [];
    for (const file of files) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.version || !data.event_info) {
          setError(`${file.name}: Invalid submission format`);
          continue;
        }
        newSubmissions.push({ ...data, _fileName: file.name });
      } catch {
        setError(`${file.name}: Failed to parse JSON`);
      }
    }
    if (newSubmissions.length) onImport(newSubmissions);
  }, [onImport]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = [...e.dataTransfer.files].filter(f => f.name.endsWith('.json'));
    if (files.length) processFiles(files);
  };

  const handleFileInput = (e) => {
    processFiles([...e.target.files]);
    e.target.value = '';
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Import Submissions</h2>

      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p className="text-muted-foreground mb-2">Drag and drop .json submission files here</p>
        <p className="text-sm text-muted-foreground mb-4">or</p>
        <label>
          <Button asChild variant="outline">
            <span>Browse files</span>
          </Button>
          <input type="file" accept=".json" multiple className="hidden" onChange={handleFileInput} />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {submissions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Loaded submissions ({submissions.length})</h3>
            <Button variant="outline" size="sm" onClick={onClear}>Clear all</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {submissions.map((s, i) => (
              <Badge key={i} variant="secondary" className="text-sm py-1">
                {(Array.isArray(s.event_info.colleague_name) ? s.event_info.colleague_name.join(', ') : s.event_info.colleague_name) || s._fileName}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({s.contacts?.length || 0}C, {s.stakeholder_requirements?.length || 0}R)
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
