import mongoose, { FilterQuery } from "mongoose";
import Author, { IAuthor } from "../models/author";

describe('Verify author schema', () => {
    test('should be invalid if first name is empty', async () => {
        const author = new Author({});
        author.family_name = 'Doe';
        author.date_of_birth = new Date('1990-01-01');
        author.date_of_death = new Date('2020-01-01');
        const validationError = author.validateSync();
        expect(validationError).toBeDefined();
        expect(validationError?.errors.first_name).toBeDefined();
    });

    test('should be invalid if first name is greater than 100 characters', async () => {
        const author = new Author({});
        author.first_name = 'a'.repeat(101);
        author.family_name = 'Doe';
        author.date_of_birth = new Date('1990-01-01');
        author.date_of_death = new Date('2020-01-01');
        const validationError = author.validateSync();
        expect(validationError).toBeDefined();
        expect(validationError?.errors.first_name).toBeDefined();
    });

    test('should be invalid if family name is empty', async () => {
        const author = new Author({});
        author.first_name = 'John';
        author.date_of_birth = new Date('1990-01-01');
        author.date_of_death = new Date('2020-01-01');
        const validationError = author.validateSync();
        expect(validationError).toBeDefined();
        expect(validationError?.errors.family_name).toBeDefined();
    });

    test('should be invalid if family name is greater than 100 characters', async () => {
        const author = new Author({});
        author.first_name = 'John';
        author.family_name = 'a'.repeat(101);
        author.date_of_birth = new Date('1990-01-01');
        author.date_of_death = new Date('2020-01-01');
        const validationError = author.validateSync();
        expect(validationError).toBeDefined();
        expect(validationError?.errors.family_name).toBeDefined();
    });

    test('should be invalid if date of birth is not a valid date', async () => {
        const author = new Author({});
        author.first_name = 'John';
        author.family_name = 'Doe';
        author.date_of_birth = new Date('2020-27-12');
        author.date_of_death = new Date('2020-12-27');
        const validationError = author.validateSync();
        expect(validationError).toBeDefined();
        expect(validationError?.errors.date_of_birth).toBeDefined();
    });

    test('should be invalid if date of death is not a valid date', async () => {
        const author = new Author({});
        author.first_name = 'John';
        author.family_name = 'Doe';
        author.date_of_birth = new Date('1990-01-01');
        author.date_of_death = new Date('2020-27-12');
        const validationError = author.validateSync();
        expect(validationError).toBeDefined();
        expect(validationError?.errors.date_of_death).toBeDefined();
    });
});

describe('Verify author schema virtuals', () => {
    test('should return the full name of the author', async () => {
        const author = new Author({});
        author.first_name = 'John';
        author.family_name = 'Doe';
        author.date_of_birth = new Date('1990-01-01');
        author.date_of_death = new Date('2020-01-01');
        expect(author.name).toBe('Doe, John');
    });

    test('should return empty string if first name is missing', async () => {
        const author = new Author({});
        author.first_name = '';
        author.family_name = 'Doe';
        author.date_of_birth = new Date('1990-01-01');
        author.date_of_death = new Date('2020-01-01');
        expect(author.name).toBe('');
    });

    test('should return empty string if family name is missing', async () => {
        const author = new Author({});
        author.first_name = 'John';
        author.family_name = '';
        author.date_of_birth = new Date('1990-01-01');
        author.date_of_death = new Date('2020-01-01');
        expect(author.name).toBe('');
    });

    test('should return empty string if both first and family names are missing', async () => {
        const author = new Author({});
        author.date_of_birth = new Date('1990-01-01');
        author.date_of_death = new Date('2020-01-01');
        expect(author.name).toBe('');
    });

    test('should return string birth - death if both dates are present', async () => {
        const author = new Author({
            first_name: 'John',
            family_name: 'Doe',
            date_of_birth: new Date('1990-01-09'),
            date_of_death: new Date('2020-12-27')
        });
        expect(author.lifespan).toBe('1990 - 2020');
    });

    test('should return string birth - if only date of birth is present', async () => {
        const author = new Author({
            first_name: 'John',
            family_name: 'Doe',
            date_of_birth: new Date('1990-01-09')
        });
        expect(author.lifespan).toBe('1990 - ');
    });

    test('should return string - death if only date of death is present', async () => {
        const author = new Author({
            first_name: 'John',
            family_name: 'Doe',
            date_of_death: new Date('2020-12-27')
        });
        expect(author.lifespan).toBe(' - 2020');
    });

    test('should return string - if both dates are missing', async () => {
        const author = new Author({
            first_name: 'John',
            family_name: 'Doe'
        });
        expect(author.lifespan).toBe(' - ');
    });
});

describe('Verify author counting', () => {
    const authors = [
        { first_name: 'John', family_name: 'Doe', date_of_birth: new Date('1958-10-10'), date_of_death: new Date('2020-01-01') },
        { first_name: 'Jane', family_name: 'Doe', date_of_birth: new Date('1964-05-21'), date_of_death: new Date('2020-01-01') },
        { first_name: 'John', family_name: 'Smith', date_of_birth: new Date('1989-01-09') },
        { first_name: 'Jane', family_name: 'Smith', date_of_birth: new Date('1992-12-27') }
    ];

    beforeAll(() => {
        Author.countDocuments = jest.fn();
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    test('should return the count of all authors if no filter is provided', async () => {
        (Author.countDocuments as jest.Mock)
            .mockImplementationOnce((filter: FilterQuery<IAuthor>) =>
                Promise.resolve(
                    Object.keys(filter).length === 0 ? authors.length : 0
                ));
        const count = await Author.getAuthorCount();
        expect(authors.length).toBe(count);
    });

    test('should return the count of authors based on first name filter', async () => {
        const expected = authors.filter(author => author.first_name === 'John').length;
        (Author.countDocuments as jest.Mock)
            .mockImplementationOnce((filter: FilterQuery<IAuthor>) =>
                Promise.resolve(
                    filter.first_name === 'John' ? expected : 0
                ));
        const count = await Author.getAuthorCount({ first_name: 'John' });
        expect(expected).toBe(count);
    });

    test('should return the count of authors based on family name filter', async () => {
        const expected = authors.filter(author => author.family_name === 'Smith').length;
        (Author.countDocuments as jest.Mock)
            .mockImplementationOnce((filter: FilterQuery<IAuthor>) =>
                Promise.resolve(
                    filter.family_name === 'Smith' ? expected : 0
                ));
        const count = await Author.getAuthorCount({ family_name: 'Smith' });
        expect(expected).toBe(count);
    });

    test('should return the count of authors based on first name and date of birth filter', async () => {
        const expected = authors.filter(author => author.first_name === 'Jane' && author.date_of_birth === authors[1].date_of_birth).length;
        (Author.countDocuments as jest.Mock)
            .mockImplementationOnce((filter: FilterQuery<IAuthor>) =>
                Promise.resolve(
                    filter.first_name === 'Jane' &&
                        filter.date_of_birth === authors[1].date_of_birth
                        ? expected : 0
                ));
        const count = await Author.getAuthorCount({ first_name: 'Jane', date_of_birth: authors[1].date_of_birth });
        expect(expected).toBe(count);
    });

    test('should return the count of authors based on family name and date of birth filter', async () => {
        const expected = authors.filter(author => author.family_name === 'Smith' && author.date_of_birth === authors[2].date_of_birth).length;
        (Author.countDocuments as jest.Mock)
            .mockImplementationOnce((filter: FilterQuery<IAuthor>) =>
                Promise.resolve(
                    filter.family_name === 'Smith' &&
                        filter.date_of_birth === authors[2].date_of_birth
                        ? expected : 0
                ));
        const count = await Author.getAuthorCount({ family_name: 'Smith', date_of_birth: authors[2].date_of_birth });
        expect(expected).toBe(count);
    });

    test('should return the count of authors with known death date filter', async () => {
        const expected = authors.filter(author => author.date_of_death).length;
        (Author.countDocuments as jest.Mock)
            .mockImplementationOnce((filter: FilterQuery<IAuthor>) =>
                Promise.resolve(
                    filter.date_of_death ? expected : 0
                ));
        const count = await Author.getAuthorCount({ date_of_death: { $exists: true } });
        expect(expected).toBe(count);
    });
});

describe('Verify author listing', () => {
    const authors = [
        { first_name: 'Kim', family_name: 'Woon', date_of_birth: new Date('1958-10-10'), date_of_death: new Date('2020-01-01') },
        { first_name: 'Moon', family_name: 'Sen', date_of_birth: new Date('1964-05-21') },
        { first_name: 'John', family_name: 'Woon', date_of_birth: new Date('1989-01-09'), date_of_death: new Date('2020-01-01') },
        { first_name: 'Moon', family_name: 'Sen', date_of_birth: new Date('1992-12-27') }
    ];

    beforeAll(() => {
        Author.find = jest.fn();
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    it('should return all authors if no sort option is provided', async () => {
        const expected = authors.map(author => {
            const a = new Author(author);
            return `${a.name} : ${a.lifespan}`;
        });
        (Author.find as jest.Mock).mockResolvedValueOnce(authors.map(author => new Author(author)));
        const result = await Author.getAllAuthors();
        expect(expected).toStrictEqual(result);
    });

    it('should return all authors sorted by first name in ascending order', async () => {
        const expected = authors.map(author => {
            return new Author(author)
        })
            .sort((a, b) => a.first_name.localeCompare(b.first_name))
            .map(author => `${author.name} : ${author.lifespan}`);
        (Author.find as jest.Mock)
            .mockImplementationOnce(() => {
                return {
                    sort: jest.fn().mockImplementationOnce((sortOpts) => {
                        if (sortOpts.first_name === 1) {
                            return Promise.resolve(authors.map(author => new Author(author))
                                .sort((a, b) => a.first_name.localeCompare(b.first_name)));
                        }
                        else {
                            return Promise.resolve(authors.map(author => new Author(author)));
                        }
                    })
                }
            })
        const result = await Author.getAllAuthors({ first_name: 1 });
        expect(expected).toStrictEqual(result);
    });

    it('should return all authors sorted by family name in descending order', async () => {
        const expected = authors.map(author => {
            return new Author(author)
        })
            .sort((a, b) => b.family_name.localeCompare(a.family_name))
            .map(author => `${author.name} : ${author.lifespan}`);
        (Author.find as jest.Mock)
            .mockImplementationOnce(() => {
                return {
                    sort: jest.fn().mockImplementationOnce((sortOpts) => {
                        if (sortOpts.family_name === -1) {
                            return Promise.resolve(authors.map(author => new Author(author))
                                .sort((a, b) => b.family_name.localeCompare(a.family_name)));
                        }
                        else {
                            return Promise.resolve(authors.map(author => new Author(author)));
                        }
                    })
                }
            })
        const result = await Author.getAllAuthors({ family_name: -1 });
        expect(expected).toStrictEqual(result);
    });
});

describe('Verify retrieving author by an ID', () => {
    const expectedAuthor = {
        _id: new mongoose.Types.ObjectId().toHexString(),
        first_name: 'Kim',
        family_name: 'Woon',
        date_of_birth: new Date('1958-10-10'),
        date_of_death: new Date('2020-01-01')
    };

    beforeAll(() => {
        Author.findOne = jest.fn();
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    it('should return the author ID if found', async () => {
        (Author.findOne as jest.Mock).mockResolvedValueOnce(expectedAuthor);
        const authorId = await Author.getAuthorIdByName(expectedAuthor.family_name, expectedAuthor.first_name);
        expect(expectedAuthor._id).toBe(authorId);
    });

    it('should return null if the author is not found', async () => {
        (Author.findOne as jest.Mock).mockResolvedValueOnce(null);
        const authorId = await Author.getAuthorIdByName('Doe', 'John');
        expect(authorId).toBeNull();
    });
});