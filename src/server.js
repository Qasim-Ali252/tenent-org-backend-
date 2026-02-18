import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
// import routes from './routes';
import { connect } from './config/index.js'; // database connectivity
import routes from './routes/index.js'
import { apiError, apiErrorHandler } from './utils/index.js'
import { compressionMiddleware } from './middleware/index.js';

const app = express();
const port = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
app.use(express.json());
app.use(compressionMiddleware())
app.use(cors());
routes(app)

app.use(({ next }) => next(new apiError(404, 'Not found', 'server')))
app.use(apiErrorHandler)

async function connectServer() {
    try {
        connect();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

    } catch (err) {
        console.error('Error starting server:', err?.message);
    }
}

connectServer();
