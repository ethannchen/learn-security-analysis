import Book from "../models/book";
import BookInstance, { IBookInstance } from "../models/bookinstance";
import express from "express";
import { escape } from "lodash";
import {
  RequestWithSanitizedId,
  validateIdMiddleware,
} from "../sanitizers/idSanitizer";

const router = express.Router();

/**
 * @route GET /book_dtls
 * @group resource - the details of a book
 * @param {string} id.query - the book id
 * @returns an object with the book title string, author name string, and an array of bookInstances
 * @returns 404 - if the book is not found
 * @returns 500 - if there is an error in the database
 */
router.get(
  "/",
  validateIdMiddleware,
  async (req: RequestWithSanitizedId, res) => {
    const id = req.sanitizedId; // Use the sanitized ID from the middleware
    if (!id) {
      return res.status(400).send("Invalid ID.");
    }
    try {
      const [book, copies] = await Promise.all([
        Book.getBook(id),
        BookInstance.getBookDetails(id),
      ]);

      if (!book) {
        res.status(404).send(`Book ${id} not found`);
        return;
      }

      res.send({
        title: book.title,
        author: book.author.name,
        copies: copies,
      });
    } catch (err) {
      console.error("Error fetching book:", err);
      res.status(500).send(escape(`Error fetching book ${id}`)); // Escape error messages
    }
  }
);

export default router;
