import { Injectable } from '@angular/core';

import { relayInit, Event, Filter } from 'nostr-tools';
import { User } from '../types/user';
import { Post } from '../types/post';

import { nip10 } from 'nostr-tools';

@Injectable({
  providedIn: 'root'
})
export class NostrServiceService {

  constructor() { }

    async relayConnect() {
        // TODO: relay should be in settings / stored on relays
        // pull from there
        const relay = relayInit('wss://relay.nostr.or.jp')
        relay.on('connect', () => {
            console.log(`connected to ${relay.url}`)
        })
        relay.on('error', () => {
            console.log(`failed to connect to ${relay.url}`)
        })

        await relay.connect()
        return relay
    }

    async getEvents(filter: Filter) {
        const relay = await this.relayConnect();
        return await relay.list([filter])
    }

    async getKind0(filter: Filter): Promise<User[]> {
        // user metadata
        filter.kinds = [0];  // force this regardless
        const relay = await this.relayConnect();
        const response = await relay.list([filter])
        let users: User[] = [];
        for (let r in response) {
            let kind0 = JSON.parse(response[r].content)
            let publicKey = response[r].pubkey
            let createdAt = response[r].created_at
            const user = new User(kind0, createdAt, publicKey);
            users.push(user);
        }
        return users;
    }

    async getUser(filter: Filter): Promise<User | null> {
        // user metadata
        filter.kinds = [0];  // force this regardless
        filter.limit = 1;
        const relay = await this.relayConnect();
        const response = await relay.get(filter)
        if (!response) {
            return null;
        }
        let kind0 = JSON.parse(response.content)
        let publicKey = response.pubkey
        let createdAt = response.created_at
        return new User(kind0, createdAt, publicKey);
    }

    async getKind1(filter: Filter): Promise<Post[]>{
        // text notes
        filter.kinds = [1];
        const relay = await this.relayConnect();
        const response = await relay.list([filter])
        let posts: Post[] = [];
        for (let r in response) {
            console.log(response[r]);
            let content = response[r].content
            let noteId = response[r].id
            let authorPubkey = response[r].pubkey
            let createdAt = response[r].created_at
            let nip10Result = nip10.parse(response[r]);
            let filter = {authors: [authorPubkey], kinds: [0]}
            let author = await this.getUser(filter)
            if (!author) {
                console.log("user not found");
                return posts;
            }
            const post = new Post(author, content, noteId, createdAt, nip10Result);
            posts.push(post);
        }
        return posts;
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
