export const buildWorkerScope = (farmId, user) => {
    const query = { farm_id: farmId };

    if (user.role === 'supervisor') {
        query.supervisor_id = user._id;
    }

    return query;
}
