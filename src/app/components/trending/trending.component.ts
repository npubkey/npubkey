import { Component, OnInit } from '@angular/core';
import { NostrBandApiService } from 'src/app/services/nostr-band-api.service';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from 'src/app/types/user';
import { Post } from 'src/app/types/post';
import { Event, nip10 } from 'nostr-tools';

interface Chip {
    color?: string;
    selected?: string;
    name: string;
}

@Component({
  selector: 'app-trending',
  templateUrl: './trending.component.html',
  styleUrls: ['./trending.component.css']
})
export class TrendingComponent implements OnInit {

    users: User[] = [];
    posts: Post[] = [];
    loading: boolean = true;
    myLikedNotes: string[] = [];

    // chip stuff
    selectedChip: Chip;
    chips: Chip[] = [
        {name: "Notes", color: "primary"},
        {name: "Profiles", color: "accent"},
    ]

    constructor(
        private apiService: NostrBandApiService,
        private nostrService: NostrService
    ) {}

    ngOnInit() {
        this.selectedChip = this.chips[0];
        this.getTrendingPosts();
        this.getTrendingProfiles();
    }

    switchFeed(chipName: string) {
        if (chipName === "Notes") {
            this.selectedChip = this.chips[0];
            this.users = [];
            this.getTrendingPosts();
        }
        if (chipName === "Profiles") {
            this.selectedChip = this.chips[1];
            this.posts = [];
            this.getTrendingProfiles();
        }
    }

    getTrendingProfiles() {
        const response = this.apiService.getTrendingProfiles();
        response.subscribe(response => {
            let trendingUsers = [];
            const profiles = response['profiles'];
            profiles.forEach(item => {
                const profile = item['profile'];
                const created_at = profile['created_at'];
                const pubkey = profile['pubkey'];
                const content = profile['content'];
                const user = new User(content, created_at, pubkey)
                trendingUsers.push(user);
            });
            this.joinUsersWithNostrUsers(trendingUsers)
        });
    }

    async joinUsersWithNostrUsers(trendingUsers: User[]) {
        let pubkeys = [];
        trendingUsers.forEach(user => {
            pubkeys.push(user.pubkey);
        });
        let nostrUsers = await this.getAndStoreNostrProfiles(pubkeys)
        this.users = trendingUsers.map(obj => nostrUsers.find(o => o.pubkey === obj.pubkey) || obj);
        this.loading = false;
    }

    async getAndStoreNostrProfiles(pubkeys: string[]) {
        return await this.nostrService.getKind0({kinds: [0], authors: pubkeys})
    }

    async getTrendingPosts() {
        const response = this.apiService.getTrendingNotes();
        let trendingPosts: Array<Post> = [];
        let authorPubkeys: Array<string> = [];
        let eventPubkeys: Array<string> = [];
        response.subscribe(response => {
            console.log(response);
            const notes = response['notes'];
            notes.forEach(item => {
                const authorPubkey = item['author']['pubkey'];
                authorPubkeys.push(authorPubkey)
                const event: Event = item['event']
                let nip10Result = nip10.parse(event);
                eventPubkeys.push(event.pubkey);
                const post = new Post(
                    event.kind,
                    event.pubkey,
                    event.content,
                    event.id,
                    event.created_at,
                    nip10Result,
                    ""
                );
                trendingPosts.push(post);
            });
            this.getAndStoreNostrProfiles(authorPubkeys);
            this.posts = trendingPosts;
            this.loading = false;
            this.getLikedPosts(eventPubkeys);
        });
    }

    async getLikedPosts(eventPubkeys: string[]) {
        this.myLikedNotes = await this.nostrService.getEventLikes(eventPubkeys);
        console.log(this.myLikedNotes);
        if (this.posts) {
            this.posts.forEach(p => {
                if (this.myLikedNotes.includes(p.noteId)) {
                    p.setPostLikedByMe(true);
                }
            });
        }
    }
}
