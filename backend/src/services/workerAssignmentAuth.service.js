


export const authorizeWorkersForTask = async (workers, actingUser) => {
    if(actingUser.role === "admin") {
        return {
            authorized: workers.map((w) => String(w._id)),
            unauthorized: []
        }
    }

    const authorized = [];
    const unauthorized = [];

    for (const worker of workers) {
        if(!worker.supervisor_id || String(worker.supervisor_id) === String(actingUser._id)) {
            authorized.push(String(worker._id));
            continue
        }

        unauthorized.push(String(worker._id));
    }


    return { authorized, unauthorized }
}