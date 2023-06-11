import { NIP10Result } from 'nostr-tools/lib/nip10';
import { Event, nip19, nip10 } from 'nostr-tools';
import { decode } from "@gandlaf21/bolt11-decode";
import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

interface TextWrap {
    text: string;
    cssClass?: string;
    addLink?: string;
}

export interface LightningResponse {
    allowsNostr?: boolean;
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

export interface ZapRequest {
    kind: number;
    content: string;
    tags: string[][];
    pubkey: string;
    created_at: number;
    id: string;
    sig: string;
}

export class Zap {
    id: string;
    kind: number;
    walletPubkey: string;
    walletNpub: string;
    createdAt: number;
    date: Date;
    sig: string;
    tags: string[][];
    username: string = "";
    picture: string = "";
    receiverPubKey: string;
    receiverNpub: string;
    receiverEventId: string;
    senderPubkey: string = "";
    senderNpub: string = "";
    senderMessage: string = "";
    bolt11: string;
    preImage: string;
    description: Event | null;
    fromNow: string = "";
    content: string = "";
    satAmount: number;
    constructor(id: string, kind: number, pubkey: string, created_at: number, sig: string, tags: string[][]) {
        this.id = id;
        this.kind = kind;
        this.walletPubkey = pubkey;
        this.setUsername(this.walletPubkey);
        this.setPicture(this.walletPubkey);
        this.walletNpub = nip19.npubEncode(this.walletPubkey);
        this.sig = sig;
        this.tags = tags;
        this.receiverPubKey = this.getUserPubkey();
        this.receiverNpub = nip19.npubEncode(this.receiverPubKey);
        this.receiverEventId = this.getEventId();
        this.bolt11 = this.getBolt11();
        this.satAmount = this.getBolt11Amount();
        this.preImage = this.getPreImage();
        this.description = this.getDescription();
        this.setSender();
        this.createdAt = created_at;
        this.date = new Date(this.createdAt*1000);
        this.setFromNow();
        this.setContent();
    }

    getUserPubkey() {
        const p: string = "p";
        for (let tag of this.tags) {
            if (tag[0] === p) {
                return tag[1];
            }
        }
        return "";
    }

    getEventId() {
        const e: string = "e";
        for (let tag of this.tags) {
            if (tag[0] === e) {
                return tag[1];
            }
        }
        return "";
    }

    getBolt11() {
        const bolt: string = "bolt11";
        for (let tag of this.tags) {
            if (tag[0] === bolt) {
                return tag[1];
            }
        }
        return "";
    }

    getPreImage() {
        const pi: string = "preimage";
        for (let tag of this.tags) {
            if (tag[0] === pi) {
                return tag[1];
            }
        }
        return "";
    }

    getDescription(): Event | null {
        const desc: string = "description";
        for (let tag of this.tags) {
            if (tag[0] === desc) {
                try {
                    return JSON.parse(tag[1]) as Event;
                } catch (e) {
                    console.log(`couldn't parse zap receipt description: ${tag}`);
                    return null;
                }
            }
        }
        return null;
    }

    getBolt11Amount() {
        if (this.bolt11) {
            const decodedInvoice = decode(this.bolt11);
            for (let s of decodedInvoice.sections) {
                if (s.name === "amount") {
                    return Number(s.value)/1000;
                }
            }
        }
        return 0;
    }

    setContent() {
        if (this.description) {
            let content = `nostr:${this.senderNpub} zapped nostr:${this.receiverNpub} ${this.satAmount} sats`;
            if (this.receiverEventId) {
                content = content + ` <p> for nostr:${nip19.neventEncode({id: this.receiverEventId})}</p>`;
            }
            if (this.senderMessage) {
                content = content + `<p> ${this.senderMessage}</p>`;
            }
            let nip10Result = nip10.parse(this.description);
            this.content = new Content(this.kind, content, nip10Result).getParsedContent()
        }
    }

    setSender() {
        if (this.description) {
            this.senderMessage = this.description.content;
            this.senderPubkey = this.description.pubkey;
            this.senderNpub = nip19.npubEncode(this.senderPubkey);
        }
    }

    setFromNow(): void {
        this.fromNow = dayjs(this.date).fromNow()
    }

    setUsername(pubkey: string): void {
        this.username = localStorage.getItem(`${pubkey}_name`) || pubkey; // TODO
    }

    setPicture(pubkey: string): void {
        this.picture = localStorage.getItem(`${pubkey}_img`) || "https://axiumradonmitigations.com/wp-content/uploads/2015/01/icon-user-default.png";
    }
}

export function isYoutubeVideo(url: string): boolean {
    var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/ig;
    return (url.match(p)) ? true : false;
}

export class Content {
    kind: number;
    content: string;
    nip10Result: NIP10Result;
    addHash: boolean;
    constructor(kind: number, content: string, nip10Result: NIP10Result, addHash: boolean = false) {
        this.kind = kind;
        this.content = content;
        this.nip10Result = nip10Result;
        this.addHash = addHash
    }

    getParsedContent(): string {
        if (this.kind === 6) {
            this.content = this.reposted();
        }
        this.content = this.nip08Replace(this.content);
        this.content = this.parseLightningInvoice(this.content);
        this.content = this.hashtagContent(this.content);
        this.content = this.linkify(this.content);
        this.content = this.replaceNostrThing(this.content);
        return this.content;
    }

    getNevent(ep: nip19.EventPointer): string {
        return nip19.neventEncode(ep);
    }

    hasEventPointer(content: string): boolean {
        if (content.includes("nostr:")) {
            return true;
        }
        return false;
    }

    ellipsis(value: string): string {
        if (value.length < 40) return value;
        let section: number = value.length / 8;
        let finalSection: number = value.length - section;
        return value.substring(0, section) + ":" +  value.substring(finalSection)
    }

    reposted(): string {
        if (this.nip10Result.root) {
            return `nostr:${this.getNevent(this.nip10Result.root)}`;
        }
        return "<repost but malformed>";
    }

    wrapTextInSpan(textWrap: TextWrap): string {
        if (textWrap.cssClass === undefined) {
            textWrap.cssClass = "hashtag"
        }
        if (this.addHash && textWrap.addLink) {
            // this fixes an issue in user about not redirecting properly
            textWrap.addLink = textWrap.addLink.replace('href="', 'href="/#/')
        }
        return `<a class="${textWrap.cssClass}" ${textWrap.addLink}>${textWrap.text}</a>`
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
        let invoices: string[] = content.match(/(lightning:|lnbc)[a-z0-9]+/gm) || []
        for (let invoice of invoices) {
            try {
                content = content.replace(invoice, this.getReplacementInvoiceHtml(invoice));
            } catch (e) {
                console.log("failed to decode lightning invoice");
            }
        }
        return content;
    }

    getInvoiceAmount(invoice: string) {
        if (invoice) {
            const decodedInvoice = decode(invoice);
            for (let s of decodedInvoice.sections) {
                if (s.name === "amount") {
                    return Number(s.value)/1000;
                }
            }
        }
        return "";
    }

    getReplacementInvoiceHtml(invoice: string) {
        const amount = this.getInvoiceAmount(invoice);
        const r = `<div class="lightning-invoice"><span class="lightning-title">Lightning Invoice: ${amount} sats</span><mat-divider></mat-divider><p>${invoice}<br><br><button class="button-17" role="button">pay</button></p></div>`
        return r;
    }

    hashtagContent(content: string): string {
        let hashtags: string[] = content.match(/#\w+/gm) || []
        hashtags = hashtags.sort((a,b) => b.length - a.length);
        hashtags.forEach(tag => {
            let tagId = tag.substring(1);  // remove #
            let textWrap: TextWrap = {text: tag, addLink: `href="/feed/${tagId}"`}
            content = content.replaceAll(tag, this.wrapTextInSpan(textWrap))
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
                return `<p><video controls><source src="${url}#t=0.1" type="video/mp4"></video></p>`;
            }
            if (isYoutubeVideo(url)) {
                // kinda hacky but works
                if (url.includes("youtu.be")) {
                    url = url.replace("youtu.be/", "youtube.com/watch?v=")
                }
                url = url.replace("watch?v=", "embed/")
                return `<p><iframe width="100%" height="350px" src="${url}"></iframe></p>`;
            }
            return `<p><a href="${url}" target="_blank">${url}</a></p>`;
        });
    }

    encodeNoteAsEvent(note: string): string {
        let decodedNote = nip19.decode(note).data.toString()
        let eventP: nip19.EventPointer = {id: decodedNote}
        return nip19.neventEncode(eventP);
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
                    let textWrap: TextWrap = {text: this.ellipsis(username), addLink: `href="/users/${npub}"`}
                    let htmlSpan = this.wrapTextInSpan(textWrap)
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
    isAReply: boolean = false;
    repostingPubkey: string;
    constructor(kind: number, pubkey: string, content: string, noteId: string, createdAt: number, nip10Result: NIP10Result, repostingPubkey: string) {
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
        this.content = new Content(kind, content, nip10Result).getParsedContent();
        this.nostrNoteId = nip19.noteEncode(this.noteId);
        this.nostrEventId = nip19.neventEncode({id: this.noteId});
        this.replyCount = 0;
        this.setIsAReply();
        this.repostingPubkey = repostingPubkey;
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

    setIsAReply(): void {
        if (this.nip10Result.root || this.nip10Result.reply) {
            this.isAReply = true;
        } else {
            this.isAReply = false;
        }
    }
}
