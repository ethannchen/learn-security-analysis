import mongoose, { Schema, Document, Model, FilterQuery } from 'mongoose';
import Book, { IBook } from './book';

/**
 * @interface IBookInstance - Interface representing the shape of a document in the bookinstance collection.
 * @property {ObjectId} book - The ID of the book associated with this instance.
 * @property {string} imprint - The imprint of the book.
 * @property {'Available' | 'Maintenance' | 'Loaned' | 'Reserved'} status - The availability status of the book instance.
 * @property {Date} due_back - The date when the book is due back.
 */
export interface IBookInstance extends Document {
  book: IBook;
  imprint: string;
  status: 'Available' | 'Maintenance' | 'Loaned' | 'Reserved';
  due_back: Date;
}

/**
 * @interface IBookInstanceModel - Interface representing the BookInstance model.
 * This interface extends the Mongoose Model interface and adds custom static methods.
 * @property {Function} getBookDetails - Static method to get book details by ID.
 * @property {Function} getAllBookStatuses - Static method to get all book statuses.
 * @property {Function} getBookInstanceCount - Static method to get the count of book instances.
 */
export interface IBookInstanceModel extends Model<IBookInstance> {
  getBookDetails(id?: string, selectOptions?: string): Promise<IBookInstance[]>;
  getAllBookStatuses(): Promise<string[]>;
  getBookInstanceCount(filter?: FilterQuery<IBookInstance>): Promise<number>;
}

var BookInstanceSchema: Schema<IBookInstance> = new Schema(
  {
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true }, //reference to the associated book
    imprint: { type: String, required: true },
    status: { type: String, required: true, enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], default: 'Maintenance' },
    due_back: { type: Date, default: Date.now }
  }
);

/**
 * Retrieves the details of a book by its ID. 
 * The details retrieved depend on the selectOptions parameter.
 * If selectOptions is provided, it will be used to select specific fields.
 * If selectOptions is not provided, it defaults to selecting the 'imprint' and 'status' fields.
 * @param id the book ID
 * @param selectOptions the fields to select
 * @returns a promise that resolves to an array of IBookInstance documents
 */
BookInstanceSchema.statics.getBookDetails = async function (id?: string, selectOptions?: string): Promise<IBookInstance[]> {
  if (!id) {
    return [];
  }
  if(selectOptions) {
    return BookInstance.find({ book: id }).select(selectOptions).exec();
  }
  return BookInstance.find({ book: id }).select('imprint status').exec();
}

/**
 * retrieves the title and status of all books that have status 'Available'
 * @returns a promise that resolves to an array of strings, 
 * each with the format "title : status"
 */

BookInstanceSchema.statics.getAllBookStatuses = async function (): Promise<string[]> {
  const listBookInstances: IBookInstance[] = await BookInstance
    .find({ status: { $eq: 'Available' } })
    .populate('book');

  const results = listBookInstances.map((bookInstance) => {
    return `${bookInstance.book.title} : ${bookInstance.status}`;
  });
  return results;
}

/**
 * retrieves the count of book instances that match the provided filter.
 * if no filter is provided, it returns the count of all book instances.
 * @param filter the filter to apply to count the book instances
 * @returns a promise that resolves to the count of book instances
 */
BookInstanceSchema.statics.getBookInstanceCount = async function (filter?: FilterQuery<IBookInstance>): Promise<number> {
  return this.countDocuments(filter || {});
}

/**
 * Compile the schema into a model and export it.
 * The model is instantiated with the IBookInstance interface and 
 * the IBookInstanceModel interface. This is to ensure that the model 
 * has both the instance methods and static methods defined 
 * in the respective interfaces.
 */
const BookInstance = mongoose.model<IBookInstance, IBookInstanceModel>('BookInstance', BookInstanceSchema);
export default BookInstance;