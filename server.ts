import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import homeRouter from "./pages/home";
import availableRouter from "./pages/books_status";
import bookRouter from "./pages/books";
import authorRouter from "./pages/authors";
import createBookRouter from "./pages/create_book";
import bookDetailsRouter from "./pages/book_details";

import { appRateLimiter } from "./sanitizers/rateLimiter";

// Create express app
const app = express();

// Middleware
app.use(cors(
    {
        origin: 'http://localhost:3000'
    }
));
app.use(appRateLimiter);
app.use('/home', homeRouter);
app.use('/available', availableRouter);
app.use('/books', bookRouter);
app.use('/authors', authorRouter);
app.use('/book_dtls', bookDetailsRouter);
app.use('/newbook', createBookRouter);

// Start server only if not in test environment
if (process.env.NODE_ENV !== "test") {
    const port = 8000;
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });

    // Connect to MongoDB only in non-test environments
    const mongoDB = 'mongodb://127.0.0.1:27017/my_library_db';
    mongoose.connect(mongoDB);
    const db = mongoose.connection;

    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    db.on('connected', () => {
        console.log('Connected to database');
    });
}

export default app; // Export only the Express app
