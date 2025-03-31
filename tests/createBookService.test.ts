import Book from "../models/book";
import app from "../server";
import request from "supertest";
import Author from "../models/author";
import Genre from "../models/genre";

describe("Verify POST /create_book", () => {

    it("should create a new book for an existing author and genre", async () => {
        const mockReqBody = {
            familyName: "Tagore",
            firstName: "Robi",
            genreName: "Fiction",
            bookTitle: "Gora"
        }
        const expectedBook = {
            title: mockReqBody.bookTitle,
            summary: "A summary of Gora",
            isbn: "1234567890",
            author: new Author({}),
            genre: [new Genre({})]
        }
        Book.prototype.saveBookOfExistingAuthorAndGenre = jest.fn().mockResolvedValue(expectedBook);
        const response = await request(app)
            .post('/newbook')
            .send(mockReqBody);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('title', expectedBook.title);
        expect(response.body).toHaveProperty('summary', expectedBook.summary);
        expect(response.body).toHaveProperty('isbn', expectedBook.isbn);
        expect(response.body).toHaveProperty('author');
        expect(response.body).toHaveProperty('genre');
    });

    it("should return 500 if book creation fails", async () => {
        const mockReqBody = {
            familyName: "Tagore",
            firstName: "Robi",
            genreName: "Fiction",
            bookTitle: "Gora"
        }
        Book.prototype.saveBookOfExistingAuthorAndGenre = jest.fn().mockRejectedValue(new Error("Database error"));
        const response = await request(app)
            .post('/newbook')
            .send(mockReqBody);
        expect(response.statusCode).toBe(500);
        expect(response.text).toBe('Error creating book: Gora');
    });

    it("should return error message with status 400 for absent properties", async () => {
        const mockReqBody = {
            familyName: "Tagore",
            firstName: "Robi",
            genreName: "Fiction"
        }
        const response = await request(app)
            .post('/newbook')
            .send(mockReqBody);
        expect(response.statusCode).toBe(400);
    });

    it("should return error message with status 400 for malicious inputs", async () => {
        const mockReqBody = {
            familyName: {"$ne": ""}, // This is a malicious input that could result in a no sql injection
            firstName: "Robi",
            genreName: "Fiction",
            bookTitle: "Gora"
        }
        const response = await request(app)
            .post('/newbook')
            .send(mockReqBody);
        expect(response.statusCode).toBe(400);
    });

    it("should return 400 if the request body has cross-site scripting (XSS) attack vectors", async () => {
        const mockReqBody = {
            familyName: "Tagore", 
            firstName: "Robi",
            genreName: "Fiction",
            bookTitle: "<script>alert('XSS')</script>" // This is a potential XSS attack vector
        }
        const response = await request(app)
            .post('/newbook')
            .send(mockReqBody);
        expect(response.statusCode).toBe(400);
        expect(response.text).toContain('Invalid input');
    });
});