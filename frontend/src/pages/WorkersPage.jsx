import { PageLoader } from '../components/ui/ui.jsx';
import WorkersHeader from '../components/workers/WorkersHeader';
import WorkersFilters from '../components/workers/WorkersFilters';
import WorkersTable from '../components/workers/WorkersTable';
import WorkerForm from '../components/workers/WorkerForm';
import DeleteWorkerModal from '../components/workers/DeleteWorkerModal';
import { useWorker } from '../hooks/useWorker.js';

const WorkersPage = () => {
  const {
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    workers,
    total,
    totalPages,
    isLoading,
    isFetching,
    editingWorker,
    isFormOpen,
    deletingWorker,
    setDeletingWorker,
    handleAddWorker,
    handleEditWorker,
    handleCloseForm,
    handleFormSubmit,
    handleDeleteConfirm,
    isSubmitting,
    isDeleting,
    supervisors,
  } = useWorker();

  if (isLoading) return <PageLoader title="Loading workers…" />;

  return (
    <div>
      <WorkersHeader total={total} onAddWorker={handleAddWorker} />

      <WorkersFilters search={search} onSearchChange={setSearch} status={status} onStatusChange={setStatus} />

      <WorkersTable
        workers={workers}
        isLoading={isFetching}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={handleEditWorker}
        onDelete={setDeletingWorker}
      />

      {isFormOpen && (
        <WorkerForm
          worker={editingWorker}
          onSubmit={handleFormSubmit}
          onClose={handleCloseForm}
          isSubmitting={isSubmitting}
          supervisors={supervisors}
        />
      )}

      {deletingWorker && (
        <DeleteWorkerModal
          worker={deletingWorker}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingWorker(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default WorkersPage;
