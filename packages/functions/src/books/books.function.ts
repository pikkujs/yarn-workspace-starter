import { type Book, type UpdateBook, type Books, CreateBook, type JustBookId } from "@bookbliss/sdk/types/books.types";
import { type APIRoutes, type APIRoute } from "../vramework-types";

const getBooks: APIRoute<void, Books> = {
    type: 'post',
    route: '/books',
    schema: null,
    func: async (services) => await services.books.getBooks()
}

const getBook: APIRoute<CreateBook, Book> = {
    type: 'get',
    route: '/book/:id',
    schema: 'JustBookId',
    func: async (services, data) => await services.books.createBook(data),
}

const updateBook: APIRoute<UpdateBook, Book> = {
    type: 'patch',
    route: '/book/:id',
    schema: 'UpdateBook',
    func: async (services, { id, ...book }) => await services.books.updateBook(id, book),
}

const deleteBook: APIRoute<JustBookId, boolean> = {
    type: 'delete',
    route: '/book/:id',
    schema: 'JustBookId',
    func: async (services, data) => await services.books.deleteBook(data.id)
}

export const routes: APIRoutes = [
    getBooks,
    getBook, 
    updateBook, 
    deleteBook
]