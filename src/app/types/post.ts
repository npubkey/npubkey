import { User } from './user';
import { NIP10Result } from 'nostr-tools/lib/nip10';

export class Post {
    content: string;
    author: User;
    noteId: string;
    createdAt: number;
    nip10Result: NIP10Result;
    date: Date;
    constructor(author: User, content: string, noteId: string, createdAt: number, nip10Result: NIP10Result) {
        this.author = author;
        this.content = content;
        this.noteId = noteId
        this.nip10Result = nip10Result;
        this.createdAt = createdAt;
        this.date = new Date(this.createdAt*1000);
    }
}
