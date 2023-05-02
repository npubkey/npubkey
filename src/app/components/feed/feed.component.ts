import { Component, OnInit } from '@angular/core';
import { Filter } from 'nostr-tools';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { Post } from '../../types/post';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {

    posts: Post[] = [];

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService
    ) {}

    ngOnInit() {
        this.getPosts();
    }

    async getPosts() {
        // could inject popular users in here too if list is too short
        let following: string[] = this.signerService.getFollowingList();
        let filter: Filter = {
            kinds: [1],
            //authors: following,
            limit: 25
        }
        console.log(filter.authors);
        let waitPosts: Post[] = await this.nostrService.getKind1(filter);
        console.log(waitPosts);
        console.log("WOW")
        this.queryForAuthorNames(waitPosts);
    }

    async queryForAuthorNames(posts: Post[]) {
        let pubkeys: string[] = [];
        posts.forEach(p => {
            pubkeys.push(p.pubkey);
        })
        await this.nostrService.getKind0({kinds: [0], authors: pubkeys})
        this.patchPostsWithUserInfo(posts);
        this.posts = posts;
    }

    patchPostsWithUserInfo(posts: Post[]) {
        posts.forEach(p => {
            p.setPicture(p.pubkey);
            p.setUsername(p.pubkey);
        });
    }
}
