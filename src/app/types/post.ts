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
    signerService: SignerService;
    constructor(pubkey: string, content: string, noteId: string, createdAt: number, nip10Result: NIP10Result) {
        this.pubkey = pubkey;
        this.npub = nip19.npubEncode(this.pubkey);
        this.content = this.getParsedContent(content);
        this.noteId = noteId
        this.nip10Result = nip10Result;
        this.createdAt = createdAt;
        this.date = new Date(this.createdAt*1000);
        this.setFromNow()
        this.setUsername(this.pubkey);
        this.setPicture(this.pubkey);
        this.signerService = new SignerService();
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

    getParsedContent(content: string): string {
        content = this.hashtagContent(content);
        content = this.linkify(content);
        content = this.replaceNostrThing(content);
        return content;
    }

    wrapTextInSpan(textWrap: TextWrap): string {
        if (textWrap.cssClass === undefined) {
            textWrap.cssClass = "hashtag"
        }
        if (textWrap.addLink) {
            return `<a class="${textWrap.cssClass}" ${textWrap.addLink}>${textWrap.text}</a>`
        }
        return `<span class="${textWrap.cssClass}" ${textWrap.addLink}>${textWrap.text}</span>`
    }

    hashtagContent(content: string): string {
        let hashtags: string[] = content.match(/#\w+/g) || []
        hashtags.forEach(tag => {
            let textWrap: TextWrap = {text: tag}
            content = content.replace(tag, this.wrapTextInSpan(textWrap))
        });
        return content
    }

    linkify(content: string): string {
        // TODO: could be improved
        let urlRegex =/(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return content.replace(urlRegex, function(url) {
            if (url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".jpeg") || url.endsWith(".webp") || url.endsWith(".gif") || url.endsWith(".gifv")) {
                return `<img src="${url}" />`
            }
            if (url.endsWith("mp4")) {
                return `<video controls><source src="${url}" type="video/mp4"></video>`
            }
            return `<a href="${url}" target="_blank">${url}</a>`;
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
                    let username = this.signerService.getUsername(npub)
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
                    let textWrap: TextWrap = {text: note, addLink: `href="/posts/${this.signerService.encodeNoteAsEvent(note)}"`}
                    content = content.replace(match, this.wrapTextInSpan(textWrap));
                }
            } catch {}
        }
        return content;
    }

    hasEventPointer(content: string): boolean {
        if (content.includes("nostr:")) {
            return true;
        }
        return false;
    }
}
