import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Kind0Content } from '../types/user';
import { User } from 'src/app/types/user';
import { relayInit, Event, Filter, nip10, UnsignedEvent, signEvent, getEventHash } from 'nostr-tools';
import { Post } from '../types/post';
import { withCache } from '@ngneat/cashew';

interface Profile {
    pubkey: string;
    new_followers_count: number;
    relays: Array<string>;
    profile: Kind0Content
}

@Injectable({
  providedIn: 'root'
})
export class NostrBandApiService {

    baseUrl: string = "https://api.nostr.band/";

    trending: string = "v0/trending/";
    profiles: string = "profiles";
    notes: string = "notes";

    constructor(
        private http: HttpClient
    ) { }

    getTrendingProfiles(): Array<User>{
        const url = `${this.baseUrl}${this.trending}${this.profiles}`;
        const response = this.http.get<JSON>(url, {context: withCache()})
        let users: Array<User> = [];
        response.subscribe(response => {
            const profiles = response['profiles'];
            profiles.forEach(item => {
                const profile = item['profile'];
                const created_at = profile['created_at'];
                const pubkey = profile['pubkey'];
                const content = profile['content'];
                const user = new User(content, created_at, pubkey)
                users.push(user);
            })
        });
        return users;
    }

    getTrendingNotes(): Array<Post>{
        const url = `${this.baseUrl}${this.trending}${this.notes}`;
        const response = this.http.get<JSON>(url, {context: withCache()})
        let posts: Array<Post> = [];
        response.subscribe(response => {
            console.log("RESPONSE")
            console.log(response);
            const notes = response['notes'];
            notes.forEach(item => {
                const author = item['author'];
                const event: Event = item['event']
                let nip10Result = nip10.parse(event);
                const post = new Post(
                    event.kind,
                    event.pubkey,
                    event.content,
                    event.id,
                    event.created_at,
                    nip10Result,
                    ""
                );
                posts.push(post);
            })
        });
        return posts;
    }
}
