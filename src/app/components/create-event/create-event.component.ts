import { Component } from '@angular/core';
import {
    relayInit,
    Event,
    UnsignedEvent,
    getEventHash,
    signEvent,
    SimplePool,
    verifySignature,
    getPublicKey
} from "nostr-tools";

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent {

    content: string = "";

    getPrivateKey() {
        return localStorage.getItem("privateKey") || "";
    }

    getUnsignedEvent(kind: number, tags: any) {
        const eventUnsigned: UnsignedEvent = {
            kind: kind,
            pubkey: getPublicKey(this.getPrivateKey()),
            tags: tags,
            content: this.content,
            created_at: Math.floor(Date.now() / 1000),
        }
        return eventUnsigned
    }

    getSignedEvent(eventId: string, signature: string, eventUnsigned: UnsignedEvent) {
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

    getNewEvent() {
        let event = this.getUnsignedEvent(1, []);
        let eventId = getEventHash(event)
        let signature = signEvent(event, this.getPrivateKey())
        let signedEvent = this.getSignedEvent(eventId, signature, event)
        return signedEvent
    }

    async sendEvent() {
        const relay = relayInit('wss://relay.damus.io')
        relay.on('connect', () => {
          console.log(`connected to ${relay.url}`)
        })
        relay.on('error', () => {
          console.log(`failed to connect to ${relay.url}`)
        })
        await relay.connect()
        let event = this.getNewEvent()
        let pub = relay.publish(event)
        pub.on('ok', () => {
          console.log(`${relay.url} has accepted our event`)
        })
        pub.on('failed', (reason: any) => {
          console.log(`failed to publish to ${relay.url}: ${reason}`)
        })
        relay.close()
    }
}
