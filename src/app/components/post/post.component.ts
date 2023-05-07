import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { Post } from '../../types/post';
import { NostrService } from 'src/app/services/nostr.service';
import { getEventHash, Event, nip19 } from 'nostr-tools';
import { Clipboard } from '@angular/cdk/clipboard';
import {MatSnackBar} from '@angular/material/snack-bar';


@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css'],
  encapsulation: ViewEncapsulation.None, // allows us to style hashtags on frontend
})
export class PostComponent implements OnInit {
    @Input() post?: Post;
    replyContent: string = "";

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService,
        private clipboard: Clipboard,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit() {}

    copynpub() {
        console.log("wow")
        if (this.post) {
            this.clipboard.copy(this.post.npub);
            this.openSnackBar("npub copied!", "dismiss");
        }
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
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
            this.replyContent = "";
            this.openSnackBar("Reply Sent!", "Dismiss");
        }
    }
}
