import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { Post } from '../../types/post';
import { NostrService } from 'src/app/services/nostr.service';
import { getEventHash, Event } from 'nostr-tools';
@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css'],
  encapsulation: ViewEncapsulation.None, // allows us to style hashtags on frontend
})
export class PostComponent implements OnInit {
    @Input() post?: Post;
    canFollow: boolean = true;

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService
    ) {}

    ngOnInit() {
        let pubkey = this.signerService.getPublicKey()
        let following = this.signerService.getFollowingList();
        if (this.post && (pubkey === this.post?.pubkey)) {
            this.canFollow = false;
        }
        if (this.post && (following.includes(pubkey))) {
            this.canFollow = false;
        }
        if (this.post) {
            this.post.content = this.hashtagContent(this.post.content);
            this.post.content = this.linkify(this.post.content)
        }
    }

    hashtagContent(content: string): string {
        let hashtags: string[] = content.match(/#\w+/g) || []
        hashtags.forEach(tag => {
            content = content.replace(tag, `<span class="hashtag">${tag}</span>`)
        });
        return content
    }

    linkify(content: string): string {
        console.log("LINKS");
        let urlRegex =/(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return content.replace(urlRegex, function(url) {
            if (url.endsWith(".png") || url.endsWith(".jpg")) {
                return `<img src="${url}" />`
            }
            return `<a href="${url}" target="_blank">${url.substring(0, 18)}...</a>`;
        });
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
