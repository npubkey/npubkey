import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { Post } from '../../types/post';
import { NostrService } from 'src/app/services/nostr.service';
import { getEventHash, Event, nip19 } from 'nostr-tools';
import { Clipboard } from '@angular/cdk/clipboard';

interface TextWrap {
    text: string;
    cssClass?: string;
    addLink?: string;
}

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css'],
  encapsulation: ViewEncapsulation.None, // allows us to style hashtags on frontend
})
export class PostComponent implements OnInit {
    @Input() post?: Post;
    canFollow: boolean = false;
    replyContent: string = "";

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService,
        private clipboard: Clipboard
    ) {}

    ngOnInit() {
        let following = this.signerService.getFollowingList();
        console.log(following)
        if (this.post) {
            console.log(this.post.pubkey);
            this.post.content = this.hashtagContent(this.post.content);
            this.post.content = this.linkify(this.post.content);
            this.post.content = this.replaceNostrThing(this.post.content);
            if (following.includes(this.post.pubkey)) {
                this.canFollow = false;
            } else {
                this.canFollow = true;
            }
        }
    }

    copynpub() {
        if (this.post) {
            this.clipboard.copy(this.post.npub);
        }
    }

    async sendReply() {
        if (this.post) {
            const privateKey = this.signerService.getPrivateKey();
            let tags = [["e", this.post.noteId, "wss://relay.damus.io/", "reply"]]
            let unsignedEvent = this.nostrService.getUnsignedEvent(1, tags, this.replyContent);
            let signedEvent: Event;
            if (privateKey !== "") {
                let eventId = getEventHash(unsignedEvent)
                signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
            } else {
                signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
            }
            this.nostrService.sendEvent(signedEvent);
        }
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
                if (match.includes("npub")) {
                    let npub = match.substring(6)
                    let username = this.signerService.getUsername(npub)
                    let textWrap: TextWrap = {text: username, addLink: `href="/users/${npub}"`}
                    let htmlSpan = this.wrapTextInSpan(textWrap)
                    console.log(htmlSpan);
                    content = content.replace(match, htmlSpan);
                }
                if (match.includes("nevent")) {
                    let nevent = match.substring(6)
                    let textWrap: TextWrap = {text: nevent, addLink: `href="/posts/${nevent}"`}
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

    async followUser() {
        if (this.post) {
            const privateKey = this.signerService.getPrivateKey();
            let tags: string[][] = this.signerService.getFollowingListAsTags()
            tags.push(["p", this.post.pubkey, "", this.post.username]);
            this.signerService.setFollowingListFromTags(tags);
            let unsignedEvent = this.nostrService.getUnsignedEvent(3, tags, "");
            let signedEvent: Event;
            if (privateKey !== "") {
                let eventId = getEventHash(unsignedEvent)
                signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
            } else {
                signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
            }
            this.nostrService.sendEvent(signedEvent);
        }
    }
}
