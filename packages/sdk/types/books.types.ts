import { RequireAtLeastOne } from "@vramework/core/types";
import * as DB from 'kysely-codegen/dist/db-pure'

export interface Book {
    id: number;
    title: string;
    author: string;
    year: number;
}

export type Books = Book[]
export type JustBookId = Pick<Book, 'id'>
export type CreateBook = Omit<Book, 'id'>
export type UpdateBook = JustBookId & RequireAtLeastOne<CreateBook>

