import { Injectable } from '@angular/core';

import { relayInit, Event, Filter, nip10, UnsignedEvent, signEvent } from 'nostr-tools';
import { User } from '../types/user';
import { Post, Zap } from '../types/post';
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
            this.storeUserInLocalStorage(e.pubkey, user.displayName, user.picture)
        });
        return users;
    }

    storeUserInLocalStorage(pubkey: string, displayName: string, picture: string) {
        // hacky but store the data so its available in other places
        localStorage.setItem(pubkey, displayName);
        localStorage.setItem(`${pubkey}_img`, picture);
    }

    async getUser(pubkey: string): Promise<User | null> {
        // user metadata
        const filter: Filter = {kinds: [0], authors: [pubkey], limit: 1}
        const relay = await this.relayConnect();
        const response = await relay.get(filter)
        if (!response) {
            return null;
        }
        let kind0 = JSON.parse(response.content)
        let user = new User(kind0, response.created_at, response.pubkey);
        this.storeUserInLocalStorage(user.pubkey, user.displayName, user.picture);
        return user;
    }

    getSince(minutesAgo: number) {
        let now = new Date()
        return Math.floor(now.setMinutes(now.getMinutes() - minutesAgo) / 1000)
    }

    getPostFromResponse(response: Event) {
        let nip10Result = nip10.parse(response);
        return new Post(
            response.kind,
            response.pubkey,
            response.content,
            response.id,
            response.created_at,
            nip10Result
        );
    }

    async getUserPosts(pubkey: string): Promise<Post[]> {
        let kind1: Filter = {
            kinds: [1],
            authors: [pubkey],
            limit: 20,
            //since: this.getSince(10)
        }
        let kind6: Filter = {
            kinds: [6],
            authors: [pubkey],
            limit: 20,
            //since: this.getSince(10)
        }
        const relay = await this.relayConnect();
        const response = await relay.list([kind6, kind1])
        let posts: Post[] = [];
        response.forEach(e => {
            posts.push(this.getPostFromResponse(e));
        });
        posts.sort((a,b) => a.createdAt - b.createdAt).reverse();
        return posts;
    }

    async getPostReplies() {}

    async getFollowingCount(pubkey: string): Promise<number> {
        // let filter: Filter = {kinds: [3], authors: [pubkey]}
        // const relay = await this.relayConnect();
        // const response = await relay.count([filter]);
        let following = await this.getFollowing(pubkey)
        return following.length
    }

    async getFollowerCount(pubkey: string): Promise<number> {
        // let filter: Filter = {kinds: [3], "#p": [pubkey]}
        // const relay = await this.relayConnect();
        // const response = await relay.count([filter]);
        // console.log(response)
        // return 10;
        let followers = await this.getFollowers(pubkey)
        return followers.length
    }

    async getFollowing(pubkey: string): Promise<string[]> {
        let filter: Filter = {kinds: [3], authors: [pubkey]}
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

    // count do count here as well ...
    async getFollowers(pubkey: string): Promise<string[]> {
        let filter: Filter = {kinds: [3], "#p": [pubkey], limit: 100}
        const relay = await this.relayConnect();
        const response = await relay.list([filter]);
        console.log(response)
        let followers: string[] = []
        if (response) {
            response.forEach(r => {
                followers.push(r.pubkey);
            });
        }
        return followers
    }

    async getPost(id: string): Promise<Post | undefined> {
        let filter: Filter = {
            kinds: [1],
            limit: 1,
            ids: [id]
        }
        const relay = await this.relayConnect();
        const response = await relay.get(filter)
        if (response) {
            return this.getPostFromResponse(response);
        }
        return undefined;
    }

    async getKind1(filter: Filter): Promise<Post[]>{
        // text notes
        filter.kinds = [1];
        const relay = await this.relayConnect();
        const response = await relay.list([filter])
        let posts: Post[] = [];
        response.forEach(e => {
            posts.push(this.getPostFromResponse(e));
        });
        return posts;
    }

    async searchUsers(searchTerm: string): Promise<User[]> {
        let filter: Filter = {
            kinds: [0],
        }
        const relay = await this.relayConnect();
        const response = await relay.list([filter])
        let users: User[] = [];
        let content;
        let user;
        response.forEach(e => {
            content = JSON.parse(e.content)
            user = new User(content, e.created_at, e.pubkey)
            if (user.displayName.includes(searchTerm)) {
                users.push(user)
            }
            this.storeUserInLocalStorage(e.pubkey, user.displayName, user.picture);
        });
        return users;
    }

    async getKind1and6(filter: Filter): Promise<Post[]>{
        // text notes
        filter.kinds = [1, 6];
        const relay = await this.relayConnect();
        const response = await relay.list([filter])
        let posts: Post[] = [];
        response.forEach(e => {
            posts.push(this.getPostFromResponse(e));
        });
        return posts;
    }

    async getPostAndReplies(id: string): Promise<Post[]>{
        let postFilter: Filter = {
            ids: [id], kinds: [1], limit: 1
        }
        let replyFilter: Filter = {
            kinds: [1], "#e": [id]
        }
        const relay = await this.relayConnect();
        const response = await relay.list([postFilter, replyFilter])
        let posts: Post[] = [];
        response.forEach(e => {
            posts.push(this.getPostFromResponse(e));
        });
        return posts;
    }

    async getReplyCounts(filters: Filter[]): Promise<Post[]>{
        const relay = await this.relayConnect();
        const response = await relay.list(filters)
        let posts: Post[] = [];
        response.forEach(e => {
            posts.push(this.getPostFromResponse(e));
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
            posts.push(this.getPostFromResponse(e));
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

    async getKind4(filter1: Filter, filter2: Filter): Promise<Event[]> {
        const relay = await this.relayConnect();
        return await relay.list([filter1, filter2]);
    }

    async getKind11(limit: number) {
        // server meta data (what types of NIPs a server is supporting)
        const relay = await this.relayConnect();
        return await relay.list([{kinds: [11], limit: limit}]);
    }

    async getZaps(filter: Filter) {
        const relay = await this.relayConnect();
        const response = await relay.list([filter])
        let zaps: Zap[] = [];
        response.forEach(e => {
            zaps.push(new Zap(e.id, e.kind, e.pubkey, e.created_at, e.sig, e.tags));
        });
        return zaps;
    }

    async getContactList(pubkey: string) {
        let filter: Filter = {kinds: [3], authors: [pubkey], limit: 1}
        const relay = await this.relayConnect();
        const response = await relay.get(filter);
        let following: string[] = []
        if (response) {
            response.tags.forEach(tag => {
                following.push(tag[1]);
            });
        }
        this.signerService.setFollowingList(following);
        return following
    }

    async search(searchTerm: string): Promise<Post[]> {
        let tags = searchTerm.split(' ');
        // recommend server / relay
        // let filter1: Filter = {
        //     kinds: [1],
        //     search: searchTerm,
        // }
        let filter2: Filter = {
            kinds: [1],
            
        }
        let filter3: Filter = {
            kinds: [1],
            "#t": tags
        }
        const relay = await this.relayConnect();
        const response = await relay.list([filter2, filter3]);
        console.log(response);
        let posts: Post[] = [];
        response.forEach(e => {
            const post = this.getPostFromResponse(e);
            if (post.content.includes(searchTerm)) {
                posts.push(post);
            }
        });
        return posts;
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
