import { Book, Books, CreateBook } from "@bookbliss/sdk/types/books.types";
import { NotFoundError } from "@vramework/core/errors"

/**
 * Service for managing books with basic CRUD operations.
 */
export class BookService {
    private books: Book[] = [];
    private nextId: number = 1;

    /**
     * Creates a new book and adds it to the collection.
     * @param title - The title of the book.
     * @param author - The author of the book.
     * @param year - The year the book was published.
     * @returns The newly created book.
     */
    createBook(book: CreateBook): Book {
        const newBook: Book = { id: this.nextId++, ...book };
        this.books.push(newBook);
        return newBook;
    }

    /**
     * Retrieves a book by its unique ID.
     * @param id - The ID of the book to retrieve.
     * @returns The book object if found, or `undefined` if no book exists with the given ID.
     */
    getBook(id: number): Book | undefined {
        return this.books.find(book => book.id === id);
    }

    /**
     * Retrieves the list of all books in the collection.
     * @returns An array of all books.
     */
    getBooks(): Books {
        return this.books;
    }

    /**
     * Updates the properties of a book with the given ID.
     * Only the provided fields in `updatedInfo` will be changed.
     * @param id - The ID of the book to update.
     * @param updatedInfo - An object containing the fields to update (e.g., `title`, `author`, `year`).
     * @returns The updated book object if the book exists, or throws a `NotFoundError` otherwise.
     */
    updateBook(id: number, updatedInfo: Partial<Omit<Book, 'id'>>): Book {
        const book = this.getBook(id);
        if (book) {
            Object.assign(book, updatedInfo);
            return book;
        }
        throw new NotFoundError(`Book with ID ${id} not found`)
    }
}
