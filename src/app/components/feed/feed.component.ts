import { Component, OnInit } from '@angular/core';
import { Filter } from 'nostr-tools';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { Post } from '../../types/post';
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
    readonly separatorKeysCodes = [ENTER, COMMA] as const;
    loading: boolean = false;
    toggleLoading = () => this.loading = !this.loading;
    posts: Post[] = [];
    followingOnly: boolean = false;
    minutesAgo: number = 5;
    previousSince: number = 0;

    // chip stuff
    chips: Chip[] = [
        {name: "Explore"},
        {name: "Following"},
        {name: "Hashtags"},
    ]
    selectedChip: Chip = this.chips[0]
    hashtags: Chip[] = [{name: 'bitcoin'}, {name: 'zaps'}, {name: 'nostr'}];
    addOnBlur = true;

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
    ) {}

    ngOnInit() {
        this.getPosts();
    }

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
        this.toggleLoading();
        this.getPosts();
    }

    getSince(minutesAgo: number) {
        let now = new Date()
        return Math.floor(now.setMinutes(now.getMinutes() - minutesAgo) / 1000)
    }

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
        console.log('getting posts');
        let filter = this.getFilter();
        this.toggleLoading();
        let waitPosts: Post[] = await this.nostrService.getKind1(filter);
        this.queryForMorePostInfo(waitPosts);
        this.incrementFilterTimes();
    }

    incrementFilterTimes() {
        // its not perfect but it does work OK
        // so we don't keep getting the same posts
        this.previousSince = this.minutesAgo;
        this.minutesAgo += 5;
    }

    async onScroll() {
        this.getPosts();
    }

    getFilter(): Filter {
        let filter: Filter = {
            kinds: [1],
            limit: 40,
        }
        if (this.followingOnly) {
            filter.authors = this.signerService.getFollowingList();
            filter.until = this.getSince(0);
        } else {
            filter.since = this.getSince(this.minutesAgo),
            filter.until = this.getSince(this.previousSince)
        }
        if (this.selectedChip.name == "Hashtags") {
            this.posts = [];
            let tags: string[] = [];
            this.hashtags.forEach(h => {tags.push(h.name)});
            filter = {
                kinds: [1],
                limit: 40,
                until: this.getSince(0),
                "#t": tags
            }
        }
        return filter;
    }

    async queryForMorePostInfo(posts: Post[]) {
        let pubkeys: string[] = [];
        let noteIds: string[] = [];
        posts.forEach(p => {
            pubkeys.push(p.pubkey);
            noteIds.push(p.noteId)
        })
        await this.nostrService.getKind0({kinds: [0], authors: pubkeys})
        let replyFilter: Filter = {
            kinds: [1], "#e": noteIds, "#p": pubkeys
        }
        this.posts.push(...posts);
        let replies = await this.nostrService.getKind1(replyFilter)
        this.patchPostsWithMoreInfo(posts, replies);
        this.toggleLoading();
    }

    patchPostsWithMoreInfo(posts: Post[], replies: Post[]) {
        let counts: {[id: string]: number} = {}
        for (const r of replies) {
            console.log(r);
            if (r.nip10Result?.reply?.id) {
                counts[r.nip10Result.reply.id] = counts[r.nip10Result.reply.id] ? counts[r.nip10Result.reply.id] + 1 : 1;
            }
        }
        posts.forEach(p => {
            p.setPicture(p.pubkey);
            p.setUsername(p.pubkey);
            p.setReplyCount(counts[p.noteId]);
        });
    }
}
