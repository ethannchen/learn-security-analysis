import mongoose, { Schema, Document, Model, FilterQuery } from 'mongoose';
import Author, { IAuthor } from './author';
import Genre, { IGenre } from './genre';

/**
 * A type that represents a book document in the books collection.
 * The functions defined in this interface are the instance methods of the model.
 * Instance methods work on a particular document and not on the collection.
 * @interface
 * @extends Document
 * @property {string} title - The title of the book.
 * @property {IAuthor} author - The author of the book.
 * @property {string} summary - The summary of the book.
 * @property {string} isbn - The ISBN of the book.
 * @property {IGenre[]} genre - The genres of the book.
 * @property {Function} saveBookOfExistingAuthorAndGenre - A function to save a book of an existing author and genre.
 */
export interface IBook extends Document {
  title: string;
  author: IAuthor;
  summary: string;
  isbn: string;
  genre: IGenre[];
  saveBookOfExistingAuthorAndGenre(author_family_name: string, author_first_name: string, genre_name: string, title: string): Promise<IBook>;
}

/**
 * A type that represents the model of a book.
 * It has been defined to represnt the static methods of the model.
 * Static methods work on the collection and not on a particular document.
 * @interface
 * @extends Model
 * @property {Function} getBook - A function to get a book by ID.
 * @property {Function} getAllBooksWithAuthors - A function to get all books with authors.
 * @property {Function} getBookCount - A function to get the count of books.
 * @property {Function} saveBookOfExistingAuthorAndGenre - A function to save a book of an existing author and genre.
 */
interface IBookModel extends Model<IBook> {
  getBook(id?: string): Promise<IBook | null>;
  getAllBooksWithAuthors(projectionOpts: string, sortOpts?: { [key: string]: 1 | -1 }): Promise<IBook[]>;
  getBookCount(fitler?: FilterQuery<IBook>): Promise<number>;
}

/**
 * The schema for the book collection.
 * It defines the shape of a document within the collection.
 * @type {Schema}
 * @property {string} title - The title of the book.
 * @property {Schema.Types.ObjectId} author - The author id of the book. It references the author collection.
 * @property {string} summary - The summary of the book.
 * @property {string} isbn - The ISBN of the book.
 * @property {Schema.Types.ObjectId[]} genre - The list of genre ids of the book. It references the genre collection.
 */
const BookSchema: Schema<IBook> = new Schema(
  {
    title: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'Author', required: true },
    summary: { type: String, required: true },
    isbn: { type: String, required: true },
    genre: [{ type: Schema.Types.ObjectId, ref: 'Genre' }]
  }
);

/**
 * The function to get a book by ID.
 * It uses the mongoose query to find a book by ID
 * and populates the author and genre fields.
 * @param id of a book
 * @returns a promise of the book or null.
 */
BookSchema.statics.getBook = async function (id?: string): Promise<IBook | null> {
  if (!id) {
    return null;
  }
  return this.findById(id).populate('author').populate('genre').exec();
}

/**
 * the function retrieves all books with author information 
 * in a sorted order if specified.
 * @param projection the fields to be selected.
 * @param sortOpts an optional parameter to sort the books.
 * @returns a promise of the books or an empty array.
 */
BookSchema.statics.getAllBooksWithAuthors = async function (projection: string, sortOpts?: { [key: string]: 1 | -1 }): Promise<IBook[]> {
  if(sortOpts) {
    return Book.find({}, projection)
    .sort(sortOpts)
    .populate('author');
  }
  return Book.find({}, projection).populate('author');
}

/**
 * retrieves the count of books in the collection based on an optional filter.
 * @param filter the filter object to be applied based on which the count will be performed.
 * @returns a promise of the count.
 */
BookSchema.statics.getBookCount = async function (filter?: FilterQuery<IBook>): Promise<number> {
  return this.countDocuments(filter || {});
}

/**
 * retrieves an existing author by name and an existing genre by name,
 * and saves a new book in this collection with the provided title, summary, and ISBN.
 * @param author_family_name 
 * @param author_first_name 
 * @param genre_name 
 * @param title 
 * @returns tne book object that has been saved.
 */
BookSchema.methods.saveBookOfExistingAuthorAndGenre = async function (author_family_name: string, author_first_name: string, genre_name: string, title: string): Promise<IBook> {
  const authorId = await Author.getAuthorIdByName(author_family_name, author_first_name);
  const genreId = await Genre.getGenreIdByName(genre_name);
  if(!authorId || !genreId) {
    throw new Error('Author or genre not found');
  }
  this.title = title;
  this.summary = 'Demo Summary to be updated later';
  this.isbn = 'ISBN2022';
  this.author = authorId;
  this.genre = [genreId];
  return await this.save();  
}

/**
 * Compile the schema into a model and export it.
 * The model is instantiated with the IBook interface and 
 * the IBookModel interface. This is to ensure that the model 
 * has both the instance methods and static methods defined 
 * in the respective interfaces.
 */
const Book = mongoose.model<IBook, IBookModel>('Book', BookSchema);
export default Book;
