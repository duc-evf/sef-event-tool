import { useState } from 'react';
import ContactForm from '@/components/input/ContactForm';
import ContactTable from '@/components/input/ContactTable';
import { Badge } from '@/components/ui/badge';

function findDuplicates(contacts) {
  const dupes = new Set();
  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      const a = contacts[i], b = contacts[j];
      if (
        (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) ||
        (a.first_name.toLowerCase() === b.first_name.toLowerCase() &&
         a.last_name.toLowerCase() === b.last_name.toLowerCase() &&
         a.company_name?.toLowerCase() === b.company_name?.toLowerCase())
      ) {
        dupes.add(a.id);
        dupes.add(b.id);
      }
    }
  }
  return dupes;
}

export default function MergedContacts({ contacts, onChange }) {
  const [editing, setEditing] = useState(null);
  const duplicates = findDuplicates(contacts);

  const handleSave = (contact) => {
    const idx = contacts.findIndex(c => c.id === contact.id);
    const next = [...contacts];
    if (idx >= 0) next[idx] = contact;
    else next.push(contact);
    onChange(next);
    setEditing(null);
  };

  const handleDelete = (ids) => {
    onChange(contacts.filter(c => !ids.includes(c.id)));
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Merged Contacts ({contacts.length})</h2>
        {duplicates.size > 0 && (
          <Badge variant="destructive">{duplicates.size / 2} potential duplicate(s)</Badge>
        )}
      </div>

      {editing && (
        <ContactForm
          contact={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <ContactTable
        contacts={contacts}
        onEdit={(c) => setEditing(c)}
        onDelete={handleDelete}
      />
    </div>
  );
}
