import app from './app.js'
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js'

const PORT = ENV.PROT || 3030

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`server is running on http://localhost:${PORT}`)
        })

    }catch(error) {
        console.error(error)
    }
}

startServer()
