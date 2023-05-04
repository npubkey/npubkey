import { NIP10Result } from 'nostr-tools/lib/nip10';
import { nip19 } from 'nostr-tools';
import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);


export class Post {
    content: string;
    pubkey: string;
    npub: string;
    noteId: string;
    createdAt: number;
    nip10Result: NIP10Result;
    date: Date;
    fromNow: string = "";
    username: string = "";
    picture: string = "";
    replyingTo: string[] = [];
    mentions: string[] = [];
    nevent: string = "";
    constructor(pubkey: string, content: string, noteId: string, createdAt: number, nip10Result: NIP10Result) {
        this.pubkey = pubkey;
        this.npub = nip19.npubEncode(this.pubkey);
        this.content = content;
        this.noteId = noteId
        this.nip10Result = nip10Result;
        this.createdAt = createdAt;
        this.date = new Date(this.createdAt*1000);
        this.setFromNow()
        this.setUsername(this.pubkey);
        this.setPicture(this.pubkey);
    }

    setUsername(pubkey: string): void {
        this.username = localStorage.getItem(`${pubkey}_name`) || this.npub;
    }

    setPicture(pubkey: string): void {
        this.picture = localStorage.getItem(`${pubkey}_img`) || "https://axiumradonmitigations.com/wp-content/uploads/2015/01/icon-user-default.png";
    }

    setFromNow(): void {
        this.fromNow = dayjs(this.date).fromNow()
    }

    setReplyingTo(): void {
        //this.replyingTo = this.nip10Result.profiles;
    }

    // setNEvent(nevent: string): void {
    //     let decodedPointer = nip19.decode(nevent);
    //     console.log("DECODED POINTER")
    //     console.log(decodedPointer)
    //     this.nevent = nevent;
    // }
}
