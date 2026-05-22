import DataTable from '@/components/shared/DataTable';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'stakeholder', label: 'Stakeholder' },
  { key: 'stakeholder_group', label: 'Stakeholder Group' },
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
      requiredFields={['description', 'stakeholder', 'stakeholder_group']}
    />
  );
}
