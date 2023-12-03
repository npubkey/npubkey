import { Component, OnInit } from '@angular/core';
import { Filter, Event } from 'nostr-tools';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { Post } from '../../types/post';
import { Paginator } from 'src/app/utils';
import { CreateEventComponent } from '../create-event/create-event.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-feed',
  templateUrl: './home-feed.component.html',
  styleUrls: ['./home-feed.component.css']
})
export class HomeFeedComponent implements OnInit {
    loading: boolean = false;
    posts: Post[] = [];
    paginator: Paginator;
    myLikes: Event[] = [];
    myLikedNoteIds: string[] = [];

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private _bottomSheet: MatBottomSheet
    ) {
        let baseTimeDiff = 120;
        let since = 120;
        this.paginator = new Paginator(0, since, baseTimeDiff=baseTimeDiff);
    }

    ngOnInit() {
        this.getPosts();
    }

    openBottomSheet(): void {
        this._bottomSheet.open(CreateEventComponent);
    }

    async getMyLikes(pubkeys: string[]) {
        this.myLikedNoteIds = await this.nostrService.getEventLikes(pubkeys);
    }

    toggleLoading = () => this.loading = !this.loading;

    setLastFeedChipName(chip: string) {
        localStorage.setItem("currentChip", chip);
    }

    async getPosts() {
        let filter = this.getFilter();
        this.toggleLoading();
        let waitPosts: Post[];
        waitPosts = await this.nostrService.getKind1(filter);
        if (waitPosts.length < 2) {
            filter.since += 5000;
            waitPosts.push(...await this.nostrService.getKind1(filter));
        }
        await this.queryForMorePostInfo(waitPosts);
    }

    async onScroll() {
        this.getPosts();
    }

    getFilter(): Filter {
        let filter: Filter = {};
        // following
        filter.kinds = [1];
        filter.limit = 100;
        filter.authors = this.signerService.getFollowingList();
        filter.since = this.paginator.since;  // two hours ago
        filter.until = this.paginator.until;
        return filter;
    }

    async queryForMorePostInfo(posts: Post[]) {
        let pubkeys: string[] = [];
        let noteIds: string[] = [];
        posts.forEach(p => {
            pubkeys.push(p.pubkey);
            noteIds.push(p.noteId)
        });
        await this.getMyLikes(noteIds);
        await this.nostrService.getKind0({kinds: [0], authors: pubkeys})
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
        let replyFilter: Filter = {
            kinds: [1], "#e": noteIds,
        }
        let replies = await this.nostrService.getKind1(replyFilter)
        let likesFilter: Filter = {
            kinds: [7], "#e": noteIds
        }
        let likes = await this.nostrService.getKind7(likesFilter);
        this.patchPostsWithMoreInfo(posts, replies, likes);
        // filter out dupes
        this.toggleLoading();
    }

    patchPostsWithMoreInfo(posts: Post[], replies: Post[], likes: Event[]) {
        let counts: {[id: string]: number} = {}
        for (const r of replies) {
            if (r.nip10Result?.reply?.id) {
                counts[r.nip10Result.reply.id] = counts[r.nip10Result.reply.id] ? counts[r.nip10Result.reply.id] + 1 : 1;
            }
        }
        let likeCounts: {[id: string]: number} = {}
        
        for (const like of likes) {
            let noteId = null;
            like.tags.slice().reverse().forEach(x => {
                if (x[0] == "e" && noteId === null) {
                    noteId = x[1];
                }
            });
            likeCounts[noteId] = likeCounts[noteId] ? likeCounts[noteId] + 1 : 1;
        }

        posts.forEach(p => {
            p.setPicture(p.pubkey);
            p.setUsername(p.pubkey);
            p.setReplyCount(counts[p.noteId]);
            p.setLikeCount(likeCounts[p.noteId]);
            if (this.myLikedNoteIds.includes(p.noteId)) {
                p.setPostLikedByMe(true);
            }
        });
    }
}
