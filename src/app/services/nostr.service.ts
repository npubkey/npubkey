import { Injectable } from '@angular/core';

import { relayInit, Event, Filter, nip10, UnsignedEvent, signEvent } from 'nostr-tools';
import { User } from '../types/user';
import { Post } from '../types/post';
import { SignerService } from './signer.service';

@Injectable({
  providedIn: 'root'
})
export class NostrService {

  constructor(
    private signerService: SignerService
  ) { }

    async relayConnect() {
        // TODO: relay should be in settings / stored on relays
        // pull from there
        const relay = relayInit('wss://relay.damus.io/')
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
        let content;
        let user;
        response.forEach(e => {
            content = JSON.parse(e.content)
            user = new User(content, e.created_at, e.pubkey)
            users.push(user)
            // hacky but store the data so its available in other places
            localStorage.setItem(`${e.pubkey}`, user.displayName);
            localStorage.setItem(`${e.pubkey}_img`, user.picture);
        });
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
        console.log(response);
        let posts: Post[] = [];
        response.forEach(e => {
            let nip10Result = nip10.parse(e);
            const post = new Post(e.pubkey, e.content, e.id, e.created_at, nip10Result);
            posts.push(post);
        });
        return posts;
    }

    async getPostAndReplies(filters: Filter[]): Promise<Post[]>{
        const relay = await this.relayConnect();
        const response = await relay.list(filters)
        console.log(response);
        let posts: Post[] = [];
        response.forEach(e => {
            let nip10Result = nip10.parse(e);
            const post = new Post(e.pubkey, e.content, e.id, e.created_at, nip10Result);
            posts.push(post);
        });
        return posts;
    }

    async getFeed(filters: Filter[]): Promise<Post[]>{
        // text notes
        const relay = await this.relayConnect();
        const response = await relay.list(filters)
        console.log(response);
        let posts: Post[] = [];
        response.forEach(e => {
            let nip10Result = nip10.parse(e);
            const post = new Post(e.pubkey, e.content, e.id, e.created_at, nip10Result);
            posts.push(post);
        });
        return posts;
    }

    async getKind2(filter: Filter) {
        // recommend server / relay
        filter.kinds = [2];
        const relay = await this.relayConnect();
        return await relay.list([filter]);
    }

    async getKind3(filter: Filter): Promise<string[]> {
        // contact lists
        filter.kinds = [3];
        const relay = await this.relayConnect();
        const response = await relay.get(filter);
        let following: string[] = []
        if (response) {
            response.tags.forEach(tag => {
                following.push(tag[1]);
            });
        }
        return following
    }

    async getKind4(filter: Filter): Promise<Event[]> {
        // direct messages
        filter.kinds = [4];
        const relay = await this.relayConnect();
        return await relay.list([filter]);
    }

    async getKind11(limit: number) {
        // server meta data (what types of NIPs a server is supporting)
        const relay = await this.relayConnect();
        return await relay.list([{kinds: [11], limit: limit}]);
    }

    async queryRelay(filter: Filter): Promise<Event | null> {
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
        let cool: Event | null = null;
        sub.on('event', (event: Event) => {
            cool = event;
            console.log('we got the event we wanted:', event)
        })
        sub.on('eose', () => {
            sub.unsub()
        })
        relay.close();
        return cool;
    }

    getUnsignedEvent(kind: number, tags: string[][], content: string) {
        const eventUnsigned: UnsignedEvent = {
            kind: kind,
            pubkey: this.signerService.getPublicKey(),
            tags: tags,
            content: content,
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
