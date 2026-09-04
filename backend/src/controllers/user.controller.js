import {
  getSupervisorsService,
  createSupervisorService,
  getSupervisorByIdService,
  deleteSupervisorService,
  updateSupervisorService,
} from "../services/user.service.js";

export const getSupervisorsController = async (req, res, next) => {
  try {
    const supervisors = await getSupervisorsService(req.scopedFarmId);

    res.status(200).json({
      status: true,
      data: supervisors,
    });
  } catch (error) {
    next(error);
  }
};

export const createSupervisorController = async (req, res, next) => {
  try {
    const { supervisor, tempPassword } = await createSupervisorService(
      req.body,
      req.scopedFarmId,
    );

    res.status(201).json({
      status: true,
      data: {
        supervisor,
        tempPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSupervisorByIdController = async (req, res, next) => {
    try {

        const { supervisor, workerStats, workers} = await getSupervisorByIdService(req.params.id, req.scopedFarmId);

        res.status(200).json({
            status: true,
            data: {
                supervisor,
                workerStats,
                workers
            }
        });

    } catch(error) {
        next(error);
    }
};

export const deleteSupervisorController = async (req, res, next) => {
  try {
    await deleteSupervisorService(req.params.id, req.scopedFarmId);

    res.status(200).json({
      status: true,
      message: "Supervisor deleted successfully",
    });

  } catch (error) {
    next(error);
  }
}

export const updateSupervisorController = async (req, res, next) => {
    try {
        const updatedSupervisor = await updateSupervisorService(req.params.id, req.scopedFarmId, req.body);

        res.status(200).json({
            status: true,
            data: updatedSupervisor
        }); 
    } catch(error) {
        next(error);
    }
}