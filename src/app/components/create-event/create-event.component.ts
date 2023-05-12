import { Component } from '@angular/core';
import { Event, getEventHash, Filter } from "nostr-tools";
import { MatSnackBar } from '@angular/material/snack-bar';
import { NostrService } from '../../services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { User } from 'src/app/types/user';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent {

    user: User | undefined | null = undefined;
    content: string = "";
    img: string = "";

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private snackBar: MatSnackBar
    ) {
        this.getUser();
    }


    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

    async getUser() {
        let pubkey = this.signerService.getPublicKey()
        let filter: Filter = {authors: [pubkey], kinds: [0], limit: 1}
        this.user = await this.nostrService.getUser(filter);
    }

    async sendEvent() {
        const privateKey = this.signerService.getPrivateKey();
        let finalContent: string = `${this.content} ${this.img}`;
        let unsignedEvent = this.nostrService.getUnsignedEvent(1, [], finalContent);
        let signedEvent: Event;
        if (privateKey !== "") {
            let eventId = getEventHash(unsignedEvent)
            signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
        } else {
            signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
        }
        this.nostrService.sendEvent(signedEvent);
        this.openSnackBar("Message Sent!", "dismiss")
        this.content = "";
    }
}
