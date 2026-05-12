import { useState } from 'react';
import RequirementForm from '@/components/input/RequirementForm';
import RequirementTable from '@/components/input/RequirementTable';

export default function MergedRequirements({ requirements, eventInfo, onChange }) {
  const [editing, setEditing] = useState(null);

  const handleSave = (req) => {
    const idx = requirements.findIndex(r => r.id === req.id);
    const next = [...requirements];
    if (idx >= 0) next[idx] = req;
    else next.push(req);
    onChange(next);
    setEditing(null);
  };

  const handleDelete = (ids) => {
    onChange(requirements.filter(r => !ids.includes(r.id)));
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Merged Requirements ({requirements.length})</h2>

      {editing && (
        <RequirementForm
          requirement={editing}
          eventInfo={eventInfo}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <RequirementTable
        requirements={requirements}
        onEdit={(r) => setEditing(r)}
        onDelete={handleDelete}
      />
    </div>
  );
}
