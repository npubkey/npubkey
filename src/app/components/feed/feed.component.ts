import { Component, OnInit } from '@angular/core';
import { Filter } from 'nostr-tools';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { Post } from '../../types/post';
import { EventEmitterService } from 'src/app/services/event-emitter.service';
import { MatChipEditedEvent, MatChipInputEvent } from '@angular/material/chips';
import {COMMA, ENTER} from '@angular/cdk/keycodes';

interface Chip {
    color?: string;
    selected?: string;
    name: string;
}

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {

    loading: boolean = false;
    posts: Post[] = [];
    followingOnly: boolean = false;
    chips: Chip[] = [
        {name: "Explore"},
        {name: "Following"},
        {name: "Hashtags"},
    ]
    selectedChip: Chip = this.chips[0]
    // Pagination
    currentPage = 1;
    pageSize = 18;
    moreItems: boolean = false;
    minutesAgo: number = 5;

    addOnBlur = true;
    readonly separatorKeysCodes = [ENTER, COMMA] as const;
    hashtags: Chip[] = [{name: 'bitcoin'}, {name: 'nostr'}];

    add(event: MatChipInputEvent): void {
      const value = (event.value || '').trim();
  
      // Add our hashtag
      if (value) {
        this.hashtags.push({name: value});
      }
  
      // Clear the input value
      event.chipInput!.clear();
    }

    remove(hashtag: Chip): void {
      const index = this.hashtags.indexOf(hashtag);

      if (index >= 0) {
        this.hashtags.splice(index, 1);
      }
    }

    edit(hashtag: Chip, event: MatChipEditedEvent) {
      const value = event.value.trim();

      // Remove hashtag if it no longer has a name
      if (!value) {
        this.remove(hashtag);
        return;
      }
      // Edit existing hashtag
      const index = this.hashtags.indexOf(hashtag);
      if (index >= 0) {
        this.hashtags[index].name = value;
      }
    }

    searchHashtags() {
        this.loading = true;
        this.getPosts();
    }

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private eventEmitterService: EventEmitterService,
    ) {}

    ngOnInit() {
        this.moreItems = true;
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

    switchFeed(chipName: string) {
        if (chipName === "Hashtags") {
            this.followingOnly = false;
            this.posts = [];
            this.selectedChip = this.chips[2];
        }
        else if (chipName === "Explore") {
            this.followingOnly = false;
            this.posts = []
            this.selectedChip = this.chips[0];
            this.getPosts();
        } else {
            this.followingOnly = true;
            this.posts = []
            this.selectedChip = this.chips[1];
            this.getPosts();
        }
    }

    async getPosts() {
        this.loading = true;
        let filter: Filter = {
            kinds: [1],
            limit: 40,
            since: this.getSince(this.minutesAgo)
        }
        if (this.followingOnly) {
            filter.authors = this.signerService.getFollowingList();
        }
        if (this.selectedChip.name == "Hashtags") {
            this.posts = [];
            let tags: string[] = [];
            this.hashtags.forEach(h => {tags.push(h.name)});
            filter = {
                kinds: [1],
                limit: 40,
                since: this.getSince(this.minutesAgo),
                "#t": tags
            }
        }
        let waitPosts: Post[] = await this.nostrService.getKind1(filter);
        this.queryForAuthorNames(waitPosts);
        this.loading = false;
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
