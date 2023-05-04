import { Component, Input, OnInit } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { User } from '../../types/user';
import { NostrService } from 'src/app/services/nostr.service';
import { getEventHash, Event } from 'nostr-tools';
import {Clipboard} from '@angular/cdk/clipboard';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

    @Input() user?: User;
    canEdit: boolean = false;
    canFollow: boolean = true;

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService,
        private clipboard: Clipboard
    ) {}

    ngOnInit() {
        let pubkey = this.signerService.getPublicKey()
        if (this.user && (pubkey === this.user?.pubkey)) {
            this.canEdit = true;
            this.canFollow = false;
        }
    }

    copynpub() {
        if (this.user) {
            this.clipboard.copy(this.user.npub);
        }
    }

    async followUser() {
        if (this.user) {
            const privateKey = this.signerService.getPrivateKey();
            let tags: string[][] = this.signerService.getFollowingListAsTags()
            tags.push(["p", this.user.pubkey, "wss://relay.damus.io/", this.user.username]);
            console.log(tags);
            this.signerService.setFollowingListFromTags(tags);
            let unsignedEvent = this.nostrService.getUnsignedEvent(3, tags, "");
            let signedEvent: Event;
            if (privateKey !== "") {
                let eventId = getEventHash(unsignedEvent)
                signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
            } else {
                console.log('using extension');
                signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
            }
            console.log(signedEvent);
            this.nostrService.sendEvent(signedEvent);
        }
    }
}
