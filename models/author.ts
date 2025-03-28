import mongoose, { Schema, Document, Model, FilterQuery } from 'mongoose';

/**
 * Define the shape of a document in the Authors collection.
 * @property first_name - The author's first name.
 * @property family_name - The author's family name.
 * @property date_of_birth - The author's date of birth.
 * @property date_of_death - The author's date of death.
 * @property name - The author's full name.
 * @property lifespan - The author's lifespan.
 */
export interface IAuthor extends Document {
  first_name: string;
  family_name: string;
  date_of_birth?: Date;
  date_of_death?: Date;
  name: string;
  lifespan: string;
}

/**
 * Define the shape of the Author model, including static methods.
 */
interface IAuthorModel extends Model<IAuthor> {
  getAuthorCount(filter?: FilterQuery<IAuthor>): Promise<number>;
  getAllAuthors(sortOpts?: { [key: string]: 1 | -1 }): Promise<string[]>;
  getAuthorIdByName(family_name: string, first_name: string): Promise<mongoose.Types.ObjectId | null>; 
}

/**
 * A schema to define the structure of author documents in MongoDB.
 * It includes virtual properties for the author's full name and lifespan.
 * It also includes static methods for getting author count, all authors, and author ID by name.
 * 
 * @property first_name - The author's first name.
 * @property family_name - The author's family name.
 * @property date_of_birth - The author's date of birth.
 * @property date_of_death - The author's date of death.
 */
var AuthorSchema: Schema<IAuthor> = new Schema(
  {
    first_name: {type: String, required: true, maxLength: 100},
    family_name: {type: String, required: true, maxLength: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
  }
);

/**
 * Virtual to generate the author's full name
 * @returns The author's full name if both first and family names exist, otherwise an empty string.
 */
AuthorSchema
.virtual('name')
.get(function () {
  let fullname = '';
  if (this.first_name && this.family_name) {
    fullname = this.family_name + ', ' + this.first_name
  }
  if (!this.first_name || !this.family_name) {
    fullname = '';
  }
  return fullname;
});

/**
 * Virtual to generate the author's lifespan
 * @returns The author's lifespan. 
 * Returns only the date of birth if date of death is not specified.
 * Returns only the date of death if date of birth is not specified.
 * Returns only '-' if either date of birth and date of death is not specified.
 */
AuthorSchema.virtual('lifespan').get(function() {
  var lifetime_string = '';
  if (this.date_of_birth) {
    lifetime_string = this.date_of_birth.getFullYear().toString();
  }
  lifetime_string += ' - ';
  if (this.date_of_death) {
    lifetime_string += this.date_of_death.getFullYear().toString();
  }
  return lifetime_string;
});

/**
 * retrieve the count of authors based on a filter.
 * if no filter is provided, it returns the count of all authors.
 * @param filter an optional filter to count authors.
 * @returns a promise that resolves to the count of authors.
 */
AuthorSchema.statics.getAuthorCount = async function (filter?: FilterQuery<IAuthor>): Promise<number> {
  return this.countDocuments(filter || {});
}

/**
 * retrieve all authors with an optional sort option. 
 * it then returns an array of strings with the format "name : lifespan"
 * @param sortOpts an optional sort option to sort the authors.
 * @returns a promise that resolves to an array of strings with the format "name : lifespan"
 */
AuthorSchema.statics.getAllAuthors = async function (sortOpts?: { [key: string]: 1 | -1 }): Promise<string[]> {
  let authorsList: IAuthor[] = [];
  if(sortOpts) {
    authorsList = await Author.find().sort(sortOpts);
  }
  else {
    authorsList = await Author.find();
  }
  return authorsList.map(author => `${author.name} : ${author.lifespan}`);
}

/**
 * retrieves the first occurrence of an author by their family and first name.
 * @param family_name 
 * @param first_name 
 * @returns a promise that resolves to the id of the author or null if not found.
 */
AuthorSchema.statics.getAuthorIdByName = async function (family_name: string, first_name: string): Promise<mongoose.Types.ObjectId | null> {
  const author = await this.findOne({ family_name: family_name, first_name: first_name });
  if (!author) {
    return null;
  }
  return author._id;
}

/**
 * Compile the schema into a model and export it.
 * The model is instantiated with the IAuthor interface and 
 * the IAuthorModel interface. This is to ensure that the model 
 * has both the instance methods and static methods defined 
 * in the respective interfaces.
 */
const Author = mongoose.model<IAuthor, IAuthorModel>('Author', AuthorSchema);
export default Author;
