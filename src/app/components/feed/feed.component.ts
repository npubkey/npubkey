import { Component, OnDestroy, OnInit } from '@angular/core';
import { Filter, Sub, Event } from 'nostr-tools';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { Post, Zap } from '../../types/post';
import { MatChipEditedEvent, MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Paginator } from 'src/app/utils';

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
export class FeedComponent implements OnInit, OnDestroy {
    readonly separatorKeysCodes = [ENTER, COMMA] as const;
    loading: boolean = false;
    posts: Post[] = [];
    zaps: Zap[] = [];
    paginator: Paginator;
    selectedChip: Chip;
    chips: Chip[] = [
        {name: "Explore"},
        {name: "Following"},
        {name: "Hashtags"},
        {name: "Zaps"},
    ]
    hashtags: Chip[] = [{name: 'bitcoin'}, {name: 'zaps'}, {name: 'nostr'}];
    addOnBlur = true;
    subscription: Sub | null = null;

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
    ) {
        this.selectedChip = this.getCurrentSelectedChip();
        let baseTimeDiff = 5;
        let since = 10;
        if (this.selectedChip.name !== "Explore") {
            baseTimeDiff = 30;
            since = 120;
        }
        this.paginator = new Paginator(0, since, baseTimeDiff=baseTimeDiff);
        this.paginator.printVars();
        console.log(this.selectedChip);
    }

    ngOnInit() {
        this.getPosts();
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsub();
        }
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
        // Add hashtag
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
        this.posts = [];
        this.toggleLoading();
        this.getPosts();
    }

    switchFeed(chipName: string) {
        this.setLastFeedChipName(chipName);
        if (chipName === "Hashtags") {
            this.posts = [];
            this.selectedChip = this.chips[2];
            this.paginator.resetFilterTimes();
        } else if (chipName === "Explore") {
            this.posts = []
            this.selectedChip = this.chips[0];
            this.paginator.resetFilterTimes();
            this.getPosts();
        } else if (chipName === "Following" ) {
            this.posts = []
            this.selectedChip = this.chips[1];
            this.paginator.resetFilterTimes();
            this.getPosts();
        } else if (chipName === "Zaps") {
            this.posts = []
            this.selectedChip = this.chips[3];
            this.paginator.resetFilterTimes();
            this.getPosts();
        }
    }

    async listenForZaps() {
        console.log("LISETING FOR ZAPS")
        const relay = await this.nostrService.relayConnect()
        // let's query for an event that exists
        const filter: Filter = {
            kinds: [9735],
            since: Math.floor(Date.now() / 1000)
        }
        this.subscription = relay.sub([filter]);
        this.subscription.on('event', (e: Event) => {
            console.log(`Zap`);
            console.log(e);
            this.zaps.unshift(new Zap(e.id, e.kind, e.pubkey, e.created_at, e.sig, e.tags));
        });
        this.subscription.on('eose', () => {
            console.log(`End of subscription events`)
        });
    }

    async getPosts() {
        let filter = this.getFilter();
        this.toggleLoading();
        let waitPosts: Post[];
        let waitZaps: Zap[];
        if (this.selectedChip.name !== "Zaps") {
            waitPosts = await this.nostrService.getKind1(filter);
            await this.queryForMorePostInfo(waitPosts);
            
        } else {
            console.log("getting zaps")
            waitZaps = await this.nostrService.getZaps(filter);
            this.zaps = waitZaps;
            this.listenForZaps();
        }
    }

    async onScroll() {
        this.getPosts();
    }

    getFilter(): Filter {
        let filter: Filter = {};
        if (this.selectedChip.name === "Zaps") {
            // zaps
            filter.kinds = [9735];
            filter.limit = 50;
            filter.since = this.paginator.since;
            filter.until = this.paginator.until;
        } else if (this.selectedChip.name == "Hashtags") {
            // hashtags
            let tags: string[] = [];
            this.hashtags.forEach(h => {tags.push(h.name)});
            filter.kinds = [1];
            filter.limit = 50;
            filter.until = this.paginator.until;
            filter["#t"] = tags;
        } else if (this.selectedChip.name === "Following") {
            // following
            filter.kinds = [1];
            filter.limit = 50;
            filter.authors = this.signerService.getFollowingList();
            filter.since = this.paginator.since;  // two hours ago
            filter.until = this.paginator.until;
        } else {
            // explore
            filter.kinds = [1];
            filter.limit = 50;
            filter.since = this.paginator.since;
            filter.until = this.paginator.until;
        }
        // this.paginator.printTimes();
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
        // join new posts and sort without ruining UI
        let waitPosts = this.posts // existing posts
        waitPosts = waitPosts.concat(posts) // incoming posts
        waitPosts = waitPosts.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.noteId === value.noteId
            ))
        )
        waitPosts.sort((a,b) => a.createdAt - b.createdAt).reverse();
        this.posts = waitPosts;
        this.paginator.incrementFilterTimes(this.posts);
        let replies = await this.nostrService.getKind1(replyFilter)
        this.patchPostsWithMoreInfo(posts, replies);
        // filter out dupes
        this.toggleLoading();
    }

    patchPostsWithMoreInfo(posts: Post[], replies: Post[]) {
        let counts: {[id: string]: number} = {}
        for (const r of replies) {
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
