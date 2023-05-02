import { Component } from '@angular/core';
import {
    Event,
    getEventHash,
} from "nostr-tools";

import {NostrService} from '../../services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent {

    content: string = "";

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService
    ) {}

    async sendEvent() {
        const privateKey = this.signerService.getPrivateKey();
        let unsignedEvent = this.nostrService.getUnsignedEvent(1, [], this.content);
        let signedEvent: Event;
        if (privateKey !== "") {
            let eventId = getEventHash(unsignedEvent)
            signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
        } else {
            console.log('using extension');
            signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
        }
        this.nostrService.sendEvent(signedEvent);
    }
}
