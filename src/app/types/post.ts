import { NIP10Result } from 'nostr-tools/lib/nip10';
import { nip19 } from 'nostr-tools';
import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import { SignerService } from '../services/signer.service';
dayjs.extend(relativeTime);

interface TextWrap {
    text: string;
    cssClass?: string;
    addLink?: string;
}

export interface LightningResponse {
    allowNostr?: boolean;
    nostrPubkey?: string;
    callback?: string; // The URL from LN SERVICE which will accept the pay request parameters
    commentAllowed?: number;
    maxSendable?: number; // Max millisatoshi amount LN SERVICE is willing to receive
    minSendable?: number; // Min millisatoshi amount LN SERVICE is willing to receive, can not be less than 1 or more than `maxSendable`
    metadata?: string; // Metadata json which must be presented as raw string here, this is required to pass signature verification at a later step
    tag?: string;
    status?: string;
    reason?: string;
}

export interface LightningInvoice {
    pr: string;
    routes?: string[];
}


export class Post {
    kind: number;
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
    nostrNoteId: string;
    nostrEventId: string;
    replyCount: number;
    constructor(kind: number, pubkey: string, content: string, noteId: string, createdAt: number, nip10Result: NIP10Result) {
        this.kind = kind;
        this.pubkey = pubkey;
        this.npub = nip19.npubEncode(this.pubkey);
        this.noteId = noteId
        this.nip10Result = nip10Result;
        this.createdAt = createdAt;
        this.date = new Date(this.createdAt*1000);
        this.setFromNow()
        this.setUsername(this.pubkey);
        this.setPicture(this.pubkey);
        this.content = this.getParsedContent(kind, content);
        this.nostrNoteId = nip19.noteEncode(this.noteId);
        this.nostrEventId = nip19.neventEncode({id: this.noteId});
        this.replyCount = 0;
    }

    setUsername(pubkey: string): void {
        this.username = localStorage.getItem(`${pubkey}_name`) || this.npub;
    }

    setPicture(pubkey: string): void {
        this.picture = localStorage.getItem(`${pubkey}_img`) || "https://axiumradonmitigations.com/wp-content/uploads/2015/01/icon-user-default.png";
    }

    setReplyCount(count: number): void {
        this.replyCount = count;
    }

    setFromNow(): void {
        this.fromNow = dayjs(this.date).fromNow()
    }

    setReplyingTo(): void {
        //this.replyingTo = this.nip10Result.profiles;
    }

    getParsedContent(kind: number, content: string): string {
        if (kind === 6) {
            content = this.reposted();
        }
        content = this.nip08Replace(content);
        content = this.parseLightningInvoice(content);
        content = this.hashtagContent(content);
        content = this.linkify(content);
        content = this.replaceNostrThing(content);
        return content;
    }

    getNevent(ep: nip19.EventPointer): string {
        return nip19.neventEncode(ep);
    }

    reposted(): string {
        if (this.nip10Result.root) {
            return `re: nostr:${this.getNevent(this.nip10Result.root)}`;
        }
        return "repost";
    }

    wrapTextInSpan(textWrap: TextWrap): string {
        if (textWrap.cssClass === undefined) {
            textWrap.cssClass = "hashtag"
        }
        return `<a class="${textWrap.cssClass}" ${textWrap.addLink}>${textWrap.text}</a>`
    }

    nip08Replace(content: string): string {
        let userTags: string[] = content.match(/#\[\d+\]/gm) || []
        // is this condition right?
        if (this.nip10Result.profiles.length !== userTags.length) {
            return content;
        }
        for (let i in userTags) {
            let userPubkey = this.nip10Result.profiles[i].pubkey
            let npub = this.getNpub(userPubkey);
            let username = this.getUsername(userPubkey);
            let textWrap: TextWrap = {text: username, addLink: `href="/users/${npub}"`}
            content = content.replace(userTags[i], this.wrapTextInSpan(textWrap))
        }
        return content
    }

    parseLightningInvoice(content: string): string {
        let invoices: string[] = content.match(/(lightning|lnbc)[a-z0-9]+/gm) || []
        console.log(invoices);
        for (let invoice of invoices) {
            console.log(invoice);
            content = content.replace(invoice, this.getReplacementInvoiceHtml(invoice));
        }
        return content;
    }

    getReplacementInvoiceHtml(invoice: string) {
        let r = `<div class="lightning-invoice"><span class="lightning-title">Lightning Invoice</span><mat-divider></mat-divider><p>${invoice}<br><br><button class="button-17" role="button">pay</button></p></div>`
        return r;
    }

    hashtagContent(content: string): string {
        let hashtags: string[] = content.match(/#\w+/g) || []
        hashtags.forEach(tag => {
            let tagId = tag.substring(1);  // remove #
            let textWrap: TextWrap = {text: tag, addLink: `href="/feed/${tagId}"`}
            content = content.replace(tag, this.wrapTextInSpan(textWrap))
        });
        return content
    }

    linkify(content: string): string {
        // TODO: could be improved
        let urlRegex =/(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return content.replace(urlRegex, function(url) {
            if (url.toLowerCase().endsWith(".png") ||
                url.toLowerCase().endsWith(".jpg") ||
                url.toLowerCase().endsWith(".jpeg") ||
                url.toLowerCase().endsWith(".webp") ||
                url.toLowerCase().endsWith(".gif") ||
                url.toLowerCase().endsWith(".gifv")
            ) {
                return `<p><img src="${url}" /></p>`
            }
            if (url.toLowerCase().endsWith("mp4") || url.toLowerCase().endsWith("mov")) {
                return `<p><video controls><source src="${url}" type="video/mp4"></video></p>`
            }
            return `<p><a href="${url}" target="_blank">${url}</a></p>`;
        });
    }

    replaceNostrThing(content: string) {
        if (!this.hasEventPointer(content)) {
            return content;
        }
        let matches = content.match(/nostr:[a-z0-9]+/gm) || []
        for (let m in matches) {
            let match = matches[m]
            try {
                if (match.startsWith("nostr:npub")) {
                    let npub = match.substring(6)
                    let username = this.getUsername(npub)
                    let textWrap: TextWrap = {text: username, addLink: `href="/users/${npub}"`}
                    let htmlSpan = this.wrapTextInSpan(textWrap)
                    console.log(htmlSpan);
                    content = content.replace(match, htmlSpan);
                }
                if (match.startsWith("nostr:nevent")) {
                    let nevent = match.substring(6)
                    let textWrap: TextWrap = {text: nevent, addLink: `href="/posts/${nevent}"`}
                    content = content.replace(match, this.wrapTextInSpan(textWrap));
                }
                if (match.startsWith("nostr:note")) {
                    let note = match.substring(6);
                    let textWrap: TextWrap = {text: note, addLink: `href="/posts/${this.encodeNoteAsEvent(note)}"`}
                    content = content.replace(match, this.wrapTextInSpan(textWrap));
                }
            } catch (e) {
                console.log(e);
            }
        }
        return content;
    }

    hasEventPointer(content: string): boolean {
        if (content.includes("nostr:")) {
            return true;
        }
        return false;
    }

    getNpub(pubkey: string): string {
        if (pubkey.startsWith("npub")) {
            return pubkey;
        }
        return nip19.npubEncode(pubkey);
    }

    getUsername(pubkey: string): string {
        if (pubkey.startsWith("npub")) {
            pubkey = nip19.decode(pubkey).data.toString()
        }
        return `@${(localStorage.getItem(`${pubkey}`) || this.getNpub(pubkey))}`
    }

    encodeNoteAsEvent(note: string): string {
        let decodedNote = nip19.decode(note).data.toString()
        let eventP: nip19.EventPointer = {id: decodedNote}
        return nip19.neventEncode(eventP);
    }
}
