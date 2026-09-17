import React from 'react'
import SupervisorsHeader from '../components/supervisors/SupervisorsHeader'
import SupervisorsTable from '../components/supervisors/SupervisorsTable'
import { useSupervisors } from '../hooks/useSupervisors.js'
import DeleteWorkerModal from '../components/workers/DeleteWorkerModal.jsx'
import DeactivateSupervisorModal from '../components/supervisors/DeactivateSupervisorModal.jsx'
import SupervisorForm from '../components/supervisors/SupervisorForm.jsx'

const SupervisorsPage = () => {

    const {
        supervisors,
        isLoading,

        isFormOpen,
        editingSupervisor,

        handleAddSupervisor,
        handleEditSupervisor,
        handleFormSubmit,

        handleCloseForm,

        isSubmitting,
        
        isDeleting,
        deletingSupervisor,
        setDeletingSupervisor,
        handlDeleteConfirm
    } = useSupervisors()

  return (
    <div>
      <SupervisorsHeader 
        total={2}
        onAddSupervisor={handleAddSupervisor}
      />

      <SupervisorsTable 
        supervisors={supervisors}
        isLoading={isLoading}
        onEdit={handleEditSupervisor}
        onDelet={setDeletingSupervisor}
      />

      {
        isFormOpen && (
          <SupervisorForm
             supervisor={editingSupervisor}
             onSubmit={handleFormSubmit}
             onClose={handleCloseForm}
             isSubmitting={isSubmitting}
          />
        )
      }

      {
        deletingSupervisor && (
            <DeactivateSupervisorModal
              supervisor={deletingSupervisor}
              onConfirm={handlDeleteConfirm}
              onClose={() => setDeletingSupervisor(null)}
              isDeleting={isDeleting}
            />
        )
      }
    </div>
  )
}

export default SupervisorsPage
