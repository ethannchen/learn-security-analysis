import app from "../server";
import request from "supertest";
import Book from "../models/book";
import mongoose from "mongoose";
import BookInstance from "../models/bookinstance";

describe("Verify GET /book_dtls/:id", () => {
    const mockBookId = new mongoose.Types.ObjectId().toHexString();

    let consoleSpy: jest.SpyInstance;

    beforeAll(() => {
        consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterAll(() => {
        consoleSpy.mockRestore();
    });
    
    it("should respond with book title, author name, and book instances with imprint and status", async () => {
        const mockBook = {
            title: "Test Book",
            author: { name: "Test Author" },
            copies: [{
                imprint: "Test Imprint",
                status: "Available"
            },
            {
                imprint: "Test Imprint 2",
                status: "Loaned"
            }]    
        }
        const expectedResponse = { ...mockBook, author: mockBook.author.name };
        Book.getBook = jest.fn().mockImplementationOnce((id) => {
            if (id === mockBookId) {
                return Promise.resolve({
                    title: mockBook.title,
                    author: mockBook.author
                });
            }
            return Promise.resolve(null);
        });

        BookInstance.getBookDetails = jest.fn().mockImplementationOnce((id) => {
            if (id === mockBookId) {
                return Promise.resolve(mockBook.copies);
            }
            return Promise.resolve([]);
        });

        const response = await request(app).get(`/book_dtls?id=${mockBookId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toStrictEqual(expectedResponse);
    });

    it("should respond with 404 if book is not found", async () => {
        Book.getBook = jest.fn().mockResolvedValue(null);
        BookInstance.getBookDetails = jest.fn().mockResolvedValue([]);
        const response = await request(app).get(`/book_dtls?id=${mockBookId}`);
        expect(response.statusCode).toBe(404);
        expect(response.text).toBe(`Book ${mockBookId} not found`);
    });

    it("should respond with 500 if there is an error fetching the book", async () => {
        Book.getBook = jest.fn().mockRejectedValue(new Error("Database error"));
        BookInstance.getBookDetails = jest.fn().mockResolvedValue([]);
        const response = await request(app).get(`/book_dtls?id=${mockBookId}`);
        expect(response.statusCode).toBe(500);
        expect(response.text).toBe(`Error fetching book ${mockBookId}`);
        expect(consoleSpy).toHaveBeenCalled();
    });

    it("should respond with 500 if there is an error fetching the book instances", async () => {
        Book.getBook = jest.fn().mockResolvedValue({});
        BookInstance.getBookDetails = jest.fn().mockRejectedValue(new Error("Database error"));
        const response = await request(app).get(`/book_dtls?id=${mockBookId}`);
        expect(response.statusCode).toBe(500);
        expect(response.text).toBe(`Error fetching book ${mockBookId}`);
        expect(consoleSpy).toHaveBeenCalled();  
    });

    it("should respond with 500 if there is an error fetching the book and book instances", async () => {
        Book.getBook = jest.fn().mockRejectedValue(new Error("Database error"));
        BookInstance.getBookDetails = jest.fn().mockRejectedValue(new Error("Database error"));
        const response = await request(app).get(`/book_dtls?id=${mockBookId}`);
        expect(response.statusCode).toBe(500);
        expect(response.text).toBe(`Error fetching book ${mockBookId}`);
        expect(consoleSpy).toHaveBeenCalled();  
    });

    it("should respond with 400 if book id is empty", async () => {  
        const response = await request(app).get("/book_dtls?id=");
        expect(response.statusCode).toBe(400);
    });

    it("should respond with 400 if book id is not a valid mongoose id", async () => {
        // Potentially malicious script as id
        const invalidId = "<script> document.body.innerHTML = \"<a href='https://google.com'> Gotcha </a>\"</script>";
        const response = await request(app).get(`/book_dtls?id=${invalidId}`);
        expect(response.statusCode).toBe(400);
    });
});