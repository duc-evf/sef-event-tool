import DataTable from '@/components/shared/DataTable';

const columns = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'company_name', label: 'Company' },
  { key: 'stakeholder_type', label: 'Type' },
  { key: 'lead_status', label: 'Status' },
];

export default function ContactTable({ contacts, onEdit, onDelete }) {
  return (
    <DataTable
      columns={columns}
      data={contacts}
      onEdit={onEdit}
      onDelete={onDelete}
      requiredFields={['first_name', 'last_name']}
    />
  );
}
