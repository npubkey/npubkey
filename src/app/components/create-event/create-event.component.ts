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
    img: string = "";

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService
    ) {}

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
    }
}
