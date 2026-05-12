import DataTable from '@/components/shared/DataTable';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'stakeholder_priority', label: 'Priority' },
  { key: 'sef_themes', label: 'SEF Themes' },
  { key: 'sectors', label: 'Sectors' },
];

export default function RequirementTable({ requirements, onEdit, onDelete }) {
  return (
    <DataTable
      columns={columns}
      data={requirements}
      onEdit={onEdit}
      onDelete={onDelete}
      requiredFields={['description']}
    />
  );
}
