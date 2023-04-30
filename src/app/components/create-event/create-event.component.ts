import { Component } from '@angular/core';
import {
    Event,
    UnsignedEvent,
    getEventHash,
    signEvent,
    getPublicKey
} from "nostr-tools";

import {NostrServiceService} from '../../services/nostr-service.service';
import { SignerService } from 'src/app/services/signer.service';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent {

    content: string = "";

    constructor(
        private nostrService: NostrServiceService,
        private signerService: SignerService
    ) {}

    getUnsignedEvent(kind: number, tags: any) {
        const eventUnsigned: UnsignedEvent = {
            kind: kind,
            pubkey: this.signerService.getPublicKey(),
            tags: tags,
            content: this.content,
            created_at: Math.floor(Date.now() / 1000),
        }
        return eventUnsigned
    }

    getSignedEvent(eventId: string, privateKey: string, eventUnsigned: UnsignedEvent) {
        let signature = signEvent(eventUnsigned, privateKey);
        const signedEvent: Event = {
            id: eventId,
            kind: eventUnsigned.kind,
            pubkey: eventUnsigned.pubkey,
            tags: eventUnsigned.tags,
            content: eventUnsigned.content,
            created_at: eventUnsigned.created_at,
            sig: signature,
          };
          return signedEvent;
    }

    async sendEvent() {
        // check for private key
        const privateKey = this.signerService.getPrivateKey()
        console.log("private key")
        console.log(privateKey);
        let unsignedEvent = this.getUnsignedEvent(1, []);
        console.log(unsignedEvent);
        let signedEvent: Event;
        if (privateKey !== "") {
            let eventId = getEventHash(unsignedEvent)
            signedEvent = this.getSignedEvent(eventId, privateKey, unsignedEvent);
        } else {
            console.log('using extension');
            signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
        }
        console.log(signedEvent);
        this.nostrService.sendEvent(signedEvent);
    }
}
