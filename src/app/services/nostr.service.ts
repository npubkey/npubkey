import { Injectable } from '@angular/core';

import { relayInit, Event, Filter, nip10, UnsignedEvent, signEvent, getEventHash } from 'nostr-tools';
import { User } from '../types/user';
import { Post, Zap } from '../types/post';
import { SignerService } from './signer.service';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { DBUser, dbUserToUser } from '../types/user';
import { SimplePool } from 'nostr-tools'


@Injectable({
  providedIn: 'root'
})
export class NostrService {

  constructor(
    private signerService: SignerService,
    private dbService: NgxIndexedDBService
  ) { }

    // db stuff idk why its in this file -- todo fix
    storeUsersInDB(users: User[]) {
        this.dbService.bulkAdd('users', users);
    }

    storeNotificationsInDB(notifications: Zap[]) {
        this.dbService.bulkAdd('notifications', notifications);
    }

    storeUserInLocalStorage(pubkey: string, displayName: string, picture: string) {
        // hacky but store the data so its available in other places
        localStorage.setItem(pubkey, displayName);
        localStorage.setItem(`${pubkey}_img`, picture);
    }

    getUserFromDB(pubkey: string): User | null {
        let user: User | null = null;
        this.dbService.getByIndex("users", "pubkey", pubkey)
            .subscribe((result: DBUser | any) => {
                if (result !== undefined) {
                    user = dbUserToUser(result)
                }
            });
        return user;
    }


    // nostr stuff
    async relayConnect() {
        /* Connects to One Relay */
        const relay = relayInit(this.signerService.getRelay());
        relay.on('connect', () => {
            console.log(`connected to ${relay.url}`)
        })
        relay.on('error', () => {
            console.log(`failed to connect to ${relay.url}`)
        })
        await relay.connect()
        return relay
    }

    relays(): string[] {
        return this.signerService.getRelays();
    }

    getPool(): SimplePool {
        return new SimplePool()
    }

    async poolList(filters: Filter[]): Promise<Event[]> {
        const pool = this.getPool()
        const relays = this.relays()
        const response = await pool.list(relays, filters)
        pool.close(relays)
        return response
    }

    async poolGet(filter: Filter): Promise<Event> {
        const pool = this.getPool()
        const relays = this.relays()
        const response = await pool.get(relays, filter)
        pool.close(relays)
        return response
    }

    async getKind0(filter: Filter, followingList: boolean = false): Promise<User[]> {
        // user metadata
        filter.kinds = [0];  // force this regardless
        const response = await this.poolList([filter])
        let users: User[] = [];
        let content: any;  // json parsed
        let user: User;
        response.forEach(e => {
            try {
                content = JSON.parse(e.content)
                user = new User(content, e.created_at, e.pubkey)
                if (followingList) {
                    user.setFollowing(followingList);
                }
                users.push(user)
                this.storeUserInLocalStorage(e.pubkey, user.displayName, user.picture)
            } catch (e) {
                console.log(e);
            }
        });
        this.storeUsersInDB(users);
        return users;
    }

    async getUser(pubkey: string): Promise<User | null> {
        // user metadata
        let user = null;
        const filter: Filter = {kinds: [0], authors: [pubkey], limit: 1}
        const response = await this.poolGet(filter)
        if (!response) {
            return null;
        }
        let kind0 = JSON.parse(response.content)
        user = new User(kind0, response.created_at, response.pubkey);
        this.storeUsersInDB([user]);
        this.storeUserInLocalStorage(user.pubkey, user.displayName, user.picture);
        return user;
    }

    getSince(minutesAgo: number) {
        let now = new Date()
        return Math.floor(now.setMinutes(now.getMinutes() - minutesAgo) / 1000)
    }

    getPostFromResponse(response: Event, repostingPubkey: string = "") {
        let nip10Result = nip10.parse(response);
        return new Post(
            response.kind,
            response.pubkey,
            response.content,
            response.id,
            response.created_at,
            nip10Result,
            repostingPubkey
        );
    }

    async getUserPosts(pubkey: string, since: number, until: number): Promise<Post[]> {
        let kind1: Filter = {
            kinds: [1],
            authors: [pubkey],
            limit: 100,
            since: since,
            until: until
        }
        let kind6: Filter = {
            kinds: [6],
            authors: [pubkey],
            limit: 100,
            since: since,
            until: until
        }
        const response = await this.poolList([kind6, kind1])
        let posts: Post[] = [];
        let repostIds: string[] = [];
        response.forEach(e => {
            if (e.kind === 1) {
                posts.push(this.getPostFromResponse(e));
            } else {
                repostIds.push(e.tags[0][1]);
            }
        });
        let repostFilter: Filter = {"ids": repostIds}
        const r2 = await this.getKind1(repostFilter, pubkey);
        posts.push(...r2);
        posts.sort((a,b) => a.createdAt - b.createdAt).reverse();
        return posts;
    }

    async getPostReplies() {}

    async getFollowingCount(pubkey: string): Promise<number> {
        // let filter: Filter = {kinds: [3], authors: [pubkey]}
        // 
        // const response = await relay.count([filter]);
        let following = await this.getFollowing(pubkey, 6969)
        return following.length
    }

    async getFollowerCount(pubkey: string): Promise<number> {
        // let filter: Filter = {kinds: [3], "#p": [pubkey]}
        // 
        // const response = await relay.count([filter]);
        // console.log(response)
        // return 10;
        let followers = await this.getFollowers(pubkey, 6969)
        return followers.length
    }

    async getFollowing(pubkey: string, limit: number = 100): Promise<string[]> {
        let filter: Filter = {kinds: [3], authors: [pubkey], limit: limit}
        
        const response = await this.poolGet(filter);
        let following: string[] = []
        if (response) {
            response.tags.forEach(tag => {
                following.push(tag[1]);
            });
        }
        return following
    }

    async getContactListEvent(pubkey: string) {
        let filter: Filter = {kinds: [3], authors: [pubkey], limit: 1}
        
        const response = await this.poolGet(filter);
        console.log(response)
        return response
    }

    async getMyLikes(): Promise<string[]> {
        let myLikesFilter: Filter = {
            kinds: [7], "authors": [this.signerService.getPublicKey()]
        }
        let myLikes = await this.getKind7(myLikesFilter);
        let myLikedNoteIds = [];
        myLikes.forEach(like => {
            try {
                let tag = like.tags[like.tags.length - 2]
                if (tag[0] == "e") {
                    let id = tag[1]
                    myLikedNoteIds.push(id);
                }

            } catch {
                console.log("err")
            }
        });
        return myLikedNoteIds
    }

    async getEventLikes(eventPubkeys: string[]): Promise<string[]> {
        let myLikesFilter: Filter = {
            kinds: [7],
            "authors": [this.signerService.getPublicKey()],
            "#p": eventPubkeys,
        }
        let myLikes = await this.getKind7(myLikesFilter);
        let myLikedNoteIds = [];
        myLikes.forEach(like => {
            try {
                let tag = like.tags[like.tags.length - 2]
                if (tag[0] == "e") {
                    let id = tag[1]
                    myLikedNoteIds.push(id);
                }

            } catch {
                console.log("err")
            }
        });
        return myLikedNoteIds
    }

    // count do count here as well ...
    async getFollowers(pubkey: string, limit: number = 100): Promise<string[]> {
        let filter: Filter = {kinds: [3], "#p": [pubkey], limit: limit}
        
        const response = await this.poolList([filter]);
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
        
        const response = await this.poolGet(filter)
        if (response) {
            return this.getPostFromResponse(response);
        }
        return undefined;
    }

    async getKind1(filter: Filter, repostingPubkey: string = ""): Promise<Post[]>{
        // text notes
        filter.kinds = [1];
        
        const response = await this.poolList([filter])
        let posts: Post[] = [];
        const muteList: string[] = this.signerService.getMuteList();
        response.forEach(e => {
            if (!muteList.includes(e.pubkey)) {
                posts.push(this.getPostFromResponse(e, repostingPubkey));
            } else {
                console.log("muted user found not including");
            }
        });
        return posts;
    }

    async searchUsers(searchTerm: string): Promise<User[]> {
        let filter: Filter = {
            kinds: [0],
        }
        
        const response = await this.poolList([filter])
        let users: User[] = [];
        let content;
        let user;
        response.forEach(e => {
            try {
                content = JSON.parse(e.content);
                user = new User(content, e.created_at, e.pubkey)
                if (user.displayName.includes(searchTerm)) {
                    users.push(user)
                }
                if (user.pubkey.includes(searchTerm)) {
                    users.push(user)
                }
                if (user.npub.includes(searchTerm)) {
                    users.push(user)
                }
                this.storeUserInLocalStorage(e.pubkey, user.displayName, user.picture);
            } catch (e) {
                console.log(e);
            }
        });
        this.storeUsersInDB(users);
        return users;
    }

    async getKind1and6(filter: Filter): Promise<Post[]>{
        // text notes
        filter.kinds = [1, 6];
        
        const response = await this.poolList([filter])
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
        
        const response = await this.poolList([postFilter, replyFilter])
        let posts: Post[] = [];
        response.forEach(e => {
            posts.push(this.getPostFromResponse(e));
        });
        return posts;
    }

    async getReplyCounts(filters: Filter[]): Promise<Post[]>{
        
        const response = await this.poolList(filters)
        let posts: Post[] = [];
        response.forEach(e => {
            posts.push(this.getPostFromResponse(e));
        });
        return posts;
    }

    async getFeed(filters: Filter[]): Promise<Post[]>{
        // text notes
        
        const response = await this.poolList(filters)
        let posts: Post[] = [];
        response.forEach(e => {
            posts.push(this.getPostFromResponse(e));
        });
        return posts;
    }

    async getKind2(filter: Filter) {
        // recommend server / relay
        filter.kinds = [2];
        
        return await this.poolList([filter]);
    }

    async getKind3(filter: Filter): Promise<string[]> {
        // contact lists
        filter.kinds = [3];
        
        const response = await this.poolGet(filter);
        let following: string[] = []
        if (response) {
            response.tags.forEach(tag => {
                following.push(tag[1]);
            });
        }
        return following;
    }

    async getKind4(filter1: Filter, filter2: Filter): Promise<Event[]> {
        
        return await this.poolList([filter1, filter2]);
    }

    async getKind4MessagesToMe(): Promise<Event[]> {
        const filter: Filter = {
            kinds: [4],
            "#p": [this.signerService.getPublicKey()],
            limit: 50
        }
        const filter2: Filter = {
            kinds: [4],
            authors: [this.signerService.getPublicKey()],
            limit: 50
        }
        
        return await this.poolList([filter, filter2]);
    }

    async getPostLikeCount(filter: Filter): Promise<number> {
        
        let likes = await this.poolList([filter]);
        return likes.length
    }

    async getKind11(limit: number) {
        // server meta data (what types of NIPs a server is supporting)
        
        return await this.poolList([{kinds: [11], limit: limit}]);
    }

    async getKind7(filter: Filter): Promise<Event[]> {
        filter.kinds = [7];
        
        return await this.poolList([filter]);
    }

    async getZaps(filter: Filter) {
        
        const response = await this.poolList([filter])
        console.log(response);
        let zaps: Zap[] = [];
        response.forEach(e => {
            
            zaps.push(new Zap(e.id, e.kind, e.pubkey, e.created_at, e.sig, e.tags));
        });
        return zaps;
    }

    async getContactList(pubkey: string) {
        let filter: Filter = {kinds: [3], authors: [pubkey], limit: 1}
        
        const response = await this.poolGet(filter);
        let following: string[] = []
        if (response) {
            response.tags.forEach(tag => {
                following.push(tag[1]);
            });
        }
        this.signerService.setFollowingList(following);
        await this.getContactListUser();
        return following
    }

    async getContactListUser() {
        const filter: Filter = {
            kinds: [0],
            authors: this.signerService.getFollowingList()
        }
        await this.getKind0(filter, true);
    }

    async getMuteList(pubkey: string): Promise<void> {
        const filter: Filter = {
            "authors": [pubkey],
            "kinds": [10000],
            "limit": 1
        }
        
        const response = await this.poolGet(filter)
        if (response) {
            this.signerService.setMuteListFromTags(response.tags);
        } else {
            this.signerService.setMuteList([]);
        }
    }

    async addToMuteList(pubkey: string): Promise<void> {
        const muteList: string[] = this.signerService.getMuteList();
        let tags: string[][] = [["p", pubkey]];
        for (let m of muteList) {
            if (m) {
                tags.push(["p", m])
            }
        }
        const unsignedEvent = this.getUnsignedEvent(10000, tags, "");
        let signedEvent: Event;
        const privateKey = this.signerService.getPrivateKey();
        if (privateKey !== "") {
            let eventId = getEventHash(unsignedEvent)
            signedEvent = this.getSignedEvent(eventId, privateKey, unsignedEvent);
        } else {
            signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
        }
        this.publishEventToPool(signedEvent);
        await this.getMuteList(this.signerService.getPublicKey());
    }

    async search(searchTerm: string): Promise<Post[]> {
        let tags = searchTerm.split(' ');
        // recommend server / relay
        // let filter1: Filter = {
        //     kinds: [1],
        //     search: searchTerm,
        // }
        let filter3: Filter = {
            kinds: [1],
            "#t": tags,
            limit: 50
        }
        
        const response = await this.poolList([filter3]);
        let posts: Post[] = [];
        response.forEach(e => {
            const post = this.getPostFromResponse(e);
            posts.push(post);
        });
        return posts;
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

    async getNotifications(): Promise<Zap[]> {
        // currently only gets zaps
        const pubkey = this.signerService.getPublicKey();
        // check for replies
        // check for zaps
        // check for mentions?
        // check for new followers
        const zapFilter: Filter = {kinds: [9735], "#p": [pubkey]}
        
        const response = await this.poolList([zapFilter])
        let notifications: Zap[] = [];
        response.forEach(e => {
            notifications.push(new Zap(e.id, e.kind, e.pubkey, e.created_at, e.sig, e.tags));
        });
        notifications.sort((a,b) => a.createdAt - b.createdAt).reverse();
        this.storeNotificationsInDB(notifications);
        return notifications;
    }

    async sendEvent(event: Event) {
        const relay = await this.relayConnect()
        relay.publish(event)
        relay.close();
    }

    async publishEventToPool(event: Event): Promise<void> {
        const relays: string[] = this.signerService.getRelays();
        const pool = new SimplePool()
        let pubs = pool.publish(relays, event)
        await Promise.all(pubs)
        pool.close(relays)
    }
}
