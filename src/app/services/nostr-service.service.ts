import { Injectable } from '@angular/core';

import { relayInit, Event, Filter } from 'nostr-tools';

@Injectable({
  providedIn: 'root'
})
export class NostrServiceService {

  constructor() { }

    async relayConnect() {
        // TODO: relay should be in settings / stored on relays
        // pull from there
        const relay = relayInit('wss://relay.damus.io')
        relay.on('connect', () => {
            console.log(`connected to ${relay.url}`)
        })
        relay.on('error', () => {
            console.log(`failed to connect to ${relay.url}`)
        })

        await relay.connect()
        return relay
    }

    async getEvents(kinds: number[], limit: number) {
        const relay = await this.relayConnect();
        return await relay.list([{kinds: kinds, limit: limit}])
    }

    async getKind0(limit: number) {
        // user metadata
        const relay = await this.relayConnect();
        return await relay.list([{kinds: [0], limit: limit}])
    }

    async getKind1(limit: number) {
        // text notes
        const relay = await this.relayConnect();
        return await relay.list([{kinds: [1], limit: limit}])
    }

    async getKind2(limit: number) {
        // recommend server / relay
        const relay = await this.relayConnect();
        return await relay.list([{kinds: [2], limit: limit}])
    }

    async getKind3(limit: number) {
        // contact lists
        const relay = await this.relayConnect();
        return await relay.list([{kinds: [3], limit: limit}])
    }

    async getKind4(limit: number) {
        // direct messages
        const relay = await this.relayConnect();
        return await relay.list([{kinds: [4], limit: limit}])
    }

    async getKind11(limit: number) {
        // server meta data (what types of NIPs a server is supporting)
        const relay = await this.relayConnect();
        return await relay.list([{kinds: [11], limit: limit}])
    }

    async queryRelay(filter: Filter) {
        const relay = await this.relayConnect()
        // let's query for an event that exists
        let sub = relay.sub([
            {
                ids: filter.ids,
                authors: filter.authors,
                kinds: filter.kinds,
                since: filter.since,
                until: filter.until,
                limit: filter.limit,
                search: filter.search
            }
        ])
        sub.on('event', (event: Event) => {
            console.log('we got the event we wanted:', event)
        })
        sub.on('eose', () => {
            sub.unsub()
        })
        relay.close();
    }

    async sendEvent(event: Event) {
        const relay = await this.relayConnect()
        let pub = relay.publish(event)
        pub.on('ok', () => {
            console.log(`${relay.url} has accepted our event`)
        })
        pub.on('failed', (reason: any) => {
            console.log(`failed to publish to ${relay.url}: ${reason}`)
        })
        relay.close();
    }
}
