import { Component, OnInit } from '@angular/core';
import { Filter } from 'nostr-tools';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { Post, Zap } from '../../types/post';
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
    posts: Post[] = [];
    zaps: Zap[] = [];
    minutesAgo: number = 5;
    previousSince: number = 0;
    selectedChip: Chip;
    // chip stuff
    chips: Chip[] = [
        {name: "Explore"},
        {name: "Following"},
        {name: "Hashtags"},
        {name: "Zaps"},
    ]
    hashtags: Chip[] = [{name: 'bitcoin'}, {name: 'zaps'}, {name: 'nostr'}];
    addOnBlur = true;

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
    ) {
        this.selectedChip = this.getCurrentSelectedChip();
    }

    ngOnInit() {
        this.getPosts();
    }

    toggleLoading = () => this.loading = !this.loading;

    getCurrentSelectedChip() {
        const currentChip = localStorage.getItem("currentChip") || "Following";
        for (let chip of this.chips) {
            if (chip.name === currentChip) {
                return chip;
            }
        }
        return this.chips[1];
    }

    setLastFeedChipName(chip: string) {
        localStorage.setItem("currentChip", chip);
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
        this.setLastFeedChipName(chipName);
        if (chipName === "Hashtags") {
            this.posts = [];
            this.selectedChip = this.chips[2];
            this.resetFilterTimes();
        } else if (chipName === "Explore") {
            this.posts = []
            this.selectedChip = this.chips[0];
            this.resetFilterTimes();
            this.getPosts();
        } else if (chipName === "Following" ) {
            this.posts = []
            this.selectedChip = this.chips[1];
            this.resetFilterTimes();
            this.getPosts();
        } else if (chipName === "Zaps") {
            this.posts = []
            this.selectedChip = this.chips[3];
            this.resetFilterTimes();
            this.getPosts();
        }
    }

    async getPosts() {
        let filter = this.getFilter();
        this.toggleLoading();
        let waitPosts: Post[];
        let waitZaps: Zap[];
        if (this.selectedChip.name !== "Zaps") {
            waitPosts = await this.nostrService.getKind1(filter);
            this.queryForMorePostInfo(waitPosts);
        } else {
            waitZaps = await this.nostrService.getZaps(filter);
            console.log("ZAPS");
            console.log(waitZaps);
            this.zaps = waitZaps;
        }
        this.incrementFilterTimes();
    }

    incrementFilterTimes() {
        // its not perfect but it does work OK
        // so we don't keep getting the same posts
        this.previousSince = this.minutesAgo;
        this.minutesAgo += 5;
    }

    resetFilterTimes() {
        this.minutesAgo = 5;
        this.previousSince = 0;
    }

    async onScroll() {
        this.getPosts();
    }

    getFilter(): Filter {
        let filter: Filter = {};
        if (this.selectedChip.name === "Zaps") {
            // zaps
            filter.kinds = [9735];
            filter.limit = 40;
            filter.since = this.getSince(this.minutesAgo);
            filter.until = this.getSince(0);
        } else if (this.selectedChip.name == "Hashtags") {
            // hashtags
            let tags: string[] = [];
            this.hashtags.forEach(h => {tags.push(h.name)});
            filter.kinds = [1];
            filter.limit = 40;
            filter.until = this.getSince(0);
            filter["#t"] = tags;
        } else if (this.selectedChip.name === "Following") {
            // following
            filter.kinds = [1];
            filter.limit = 50;
            filter.authors = this.signerService.getFollowingList();
            filter.since = this.getSince(120);  // two hours ago
            filter.until = this.getSince(0);
        } else {
            // explore
            filter.kinds = [1];
            filter.limit = 50;
            filter.since = this.getSince(this.minutesAgo);
            filter.until = this.getSince(this.previousSince);
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
        this.posts.sort((a,b) => a.createdAt - b.createdAt).reverse();
        let replies = await this.nostrService.getKind1(replyFilter)
        this.patchPostsWithMoreInfo(posts, replies);
        this.posts = this.posts.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.noteId === value.noteId
            ))
        )
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
