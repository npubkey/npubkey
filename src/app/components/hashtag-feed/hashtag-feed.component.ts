import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Filter } from 'nostr-tools';
import { Post } from 'src/app/types/post';
import { NostrService } from 'src/app/services/nostr.service';

@Component({
  selector: 'app-hashtag-feed',
  templateUrl: './hashtag-feed.component.html',
  styleUrls: ['./hashtag-feed.component.css']
})
export class HashtagFeedComponent implements OnInit {

    hashtag: string;
    posts: Post[] = [];
    constructor(
        private nostrService: NostrService,
        private route: ActivatedRoute,
    ) {
        this.hashtag = this.route.snapshot.paramMap.get('hashtag') || "";
        route.params.subscribe(val => {
            this.hashtag = val["hashtag"];
            this.getHashtagPosts();
        });
    }

    ngOnInit(): void {
        
    }

    patchPostsWithUserInfo(posts: Post[]) {
        posts.forEach(p => {
            p.setPicture(p.pubkey);
            p.setUsername(p.pubkey);
        });
    }

    async queryForAuthorNames(posts: Post[]) {
        let pubkeys: string[] = [];
        posts.forEach(p => {
            pubkeys.push(p.pubkey);
        })
        await this.nostrService.getKind0({kinds: [0], authors: pubkeys})
        this.posts.push(...posts);
        this.patchPostsWithUserInfo(posts);
    }

    async getHashtagPosts() {
        this.posts = [];
        let filter: Filter = {
            kinds: [1],
            limit: 50,
            "#t": [this.hashtag]
        }
        let waitPosts: Post[] = await this.nostrService.getKind1(filter);
        this.queryForAuthorNames(waitPosts);
    }
}
