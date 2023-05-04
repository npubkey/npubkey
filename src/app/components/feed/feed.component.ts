import { Component, OnInit } from '@angular/core';
import { Filter } from 'nostr-tools';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { Post } from '../../types/post';
import { EventEmitterService } from 'src/app/services/event-emitter.service';
@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {

    loading: boolean = false; // TODO
    posts: Post[] = [];
    followingOnly: boolean = true;
    buttonText: string = "Following Only";

    // Pagination
    currentPage = 1;
    pageSize = 18;
    moreItems: boolean = false;
    minutesAgo: number = 5;

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private eventEmitterService: EventEmitterService,
    ) {}

    ngOnInit() {
        this.moreItems = true;
        this.loading = true;
        this.getPosts();
        this.eventEmitterService.loadMorePosts$
        .subscribe(message => {
          this.getPosts();
        });
    }

    getSince(minutesAgo: number) {
        let now = new Date()
        return Math.floor(now.setMinutes(now.getMinutes() - minutesAgo) / 1000)
    }

    // morePosts() {
    //     this.minutesAgo = this.minutesAgo + 3;
    //     this.getPosts();
    // }

    switchFeed() {
        if (this.followingOnly === true) {
            this.followingOnly = false;
            this.buttonText = "Explore";
            this.posts = []
            this.getPosts();
        } else {
            this.followingOnly = true;
            this.buttonText = "Following Only";
            this.posts = []
            this.getPosts();
        }
    }

    async getPosts() {
        // could inject popular users in here too if list is too short
        let following: string[] = this.signerService.getFollowingList();
        let filter: Filter = {
            kinds: [1],
            limit: 40,
            since: this.getSince(this.minutesAgo)
        }
        if (this.followingOnly) {
            filter.authors = following
        }
        let waitPosts: Post[] = await this.nostrService.getKind1(filter);
        this.queryForAuthorNames(waitPosts);
    }

    async queryForAuthorNames(posts: Post[]) {
        let pubkeys: string[] = [];
        posts.forEach(p => {
            pubkeys.push(p.pubkey);
        })
        await this.nostrService.getKind0({kinds: [0], authors: pubkeys})
        this.posts.push(...posts);
        this.patchPostsWithUserInfo(posts);
        if (posts.length < this.pageSize) {
            this.moreItems = false;
        }
    }

    patchPostsWithUserInfo(posts: Post[]) {
        posts.forEach(p => {
            p.setPicture(p.pubkey);
            p.setUsername(p.pubkey);
        });
    }
}
