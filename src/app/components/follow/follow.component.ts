import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { User } from 'src/app/types/user';
import { getEventHash, Event } from 'nostr-tools';

@Component({
  selector: 'app-follow',
  templateUrl: './follow.component.html',
  styleUrls: ['./follow.component.css']
})
export class FollowComponent implements OnInit {
    canFollow: boolean = true;
    buttonText: string = "person_add";
    @Input() user?: User;

    constructor(
        private snackBar: MatSnackBar,
        private signerService: SignerService,
        private nostrService: NostrService
    ) {}

    ngOnInit() {
        let following = this.signerService.getFollowingList();
        if (this.user) {
            if (following.includes(this.user.pubkey)) {
                this.canFollow = false;
                this.buttonText = "person_remove";
            } else {
                this.canFollow = true;
                this.buttonText = "person_add";
            }
        }
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

    async sendFollowEvent(unfollow=false) {
        if (this.user) {
            const privateKey = this.signerService.getPrivateKey();
            let tags: string[][] = this.signerService.getFollowingListAsTags()
            if (unfollow) {
                tags = tags.filter(tag => {
                    return tag[1] !== this.user?.pubkey
                });
            } else {
                tags.push(["p", this.user.pubkey, "wss://relay.damus.io/", this.user.username]);
            }
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

    followUser() {
        console.log("following")
        this.sendFollowEvent()
        if (this.user) {
            this.buttonText = "Unfollow";
            this.canFollow = false;
            this.openSnackBar(`Followed: ${this.user.displayName}`, "Dismiss")
        }
    }

    unFollowUser() {
        console.log("unfollowing")
        this.sendFollowEvent()
        if (this.user) {
            this.buttonText = "Follow";
            this.canFollow = true;
            this.openSnackBar(`Unfollowed: ${this.user.displayName}`, "Dismiss")
        }
    }
}
