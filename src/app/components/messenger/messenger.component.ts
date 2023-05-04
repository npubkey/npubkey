import { Component, OnInit } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from "../../types/user";
import { getEventHash, Event, nip19, nip04, Filter } from 'nostr-tools';
import { SignerService } from 'src/app/services/signer.service';

@Component({
  selector: 'app-messenger',
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.css']
})
export class MessengerComponent {

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
    ) {}

    content: string = "";
    messages: string[] = [];

    ngOnInit(): void {
        this.getMessages();
    }

    async getMessages() {
        let npubk = "npub1gempv37k4kumtqsxqkpcg9hcgkvewprq9sztqj95ea7d46hyqyhsmvwg3m"
        let toPubKey = nip19.decode(npubk).data.toString();
        console.log(toPubKey);
        let filter: Filter = {kinds: [4], authors: [this.signerService.getPublicKey()]}
        let dmEvents: Event[] = await this.nostrService.getKind4(filter)
        console.log(dmEvents);
        for (let e in dmEvents) {
            let decryptedContent = await this.decryptCipherText(dmEvents[e].content);
            console.log(decryptedContent);
            this.messages.push(decryptedContent);
        }
    }

    encryptContent(toPubKey: string, content: string) {
        return this.signerService.signDMWithExtension(toPubKey, content);
        // return nip04.encrypt(sk1, pk2, this.content);
    }

    async decryptCipherText(content: string): Promise<string> {
        let selfPubkey = this.signerService.getPublicKey();
        return await this.signerService.decryptDMWithExtension(selfPubkey, content);
        // return nip04.encrypt(sk1, pk2, this.content);
    }

    async sendEvent() {
        const privateKey = this.signerService.getPrivateKey();
        let npubk = "npub1gempv37k4kumtqsxqkpcg9hcgkvewprq9sztqj95ea7d46hyqyhsmvwg3m"
        let toPubKey = nip19.decode(npubk).data.toString();
        let toFriendContent: string = await this.encryptContent(toPubKey, this.content);
        let selfPubkey = this.signerService.getPublicKey();
        let selfContent: string = await this.encryptContent(selfPubkey, this.content);
        let toTags = [["p", toPubKey]]
        let selfTags = [["p", selfPubkey]]
        let toFriendUnsignedEvent = this.nostrService.getUnsignedEvent(4, toTags, toFriendContent);
        let toSelfUnsignedEvent = this.nostrService.getUnsignedEvent(4, selfTags, selfContent);
        let toFriendSignedEvent: Event;
        let toSelfSignedEvent: Event;
        if (privateKey !== "") {
            let toFriendEventId = getEventHash(toFriendUnsignedEvent)
            let toSelfEventId = getEventHash(toSelfUnsignedEvent)
            toFriendSignedEvent = this.nostrService.getSignedEvent(toFriendEventId, privateKey, toFriendUnsignedEvent);
            toSelfSignedEvent = this.nostrService.getSignedEvent(toSelfEventId, privateKey, toSelfUnsignedEvent)
        } else {
            console.log('using extension');
            toFriendSignedEvent = await this.signerService.signEventWithExtension(toFriendUnsignedEvent);
            toSelfSignedEvent = await this.signerService.signEventWithExtension(toSelfUnsignedEvent);
        }
        this.nostrService.sendEvent(toFriendSignedEvent);
        this.nostrService.sendEvent(toSelfSignedEvent);
    }
}
