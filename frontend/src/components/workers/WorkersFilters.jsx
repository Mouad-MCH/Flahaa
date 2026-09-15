import { Search } from 'lucide-react';

const WorkersFilters = ({ search, onSearchChange, status, onStatusChange }) => {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="relative min-w-55 flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          type="text"
          className="input"
          style={{ paddingLeft: '2.25rem' }}
          placeholder="Search by name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select
        className="select flex-1"
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
};

export default WorkersFilters;
