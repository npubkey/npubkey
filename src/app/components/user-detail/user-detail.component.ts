import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from '../../types/user';
import { Post } from '../../types/post';
import { Filter } from 'nostr-tools';
import { nip19 } from 'nostr-tools';
import { Paginator } from 'src/app/utils';
import { SignerService } from 'src/app/services/signer.service';
import { Content } from 'src/app/types/post';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {

    user: User | null = null;
    npub: string = "";
    posts: Post[] = [];
    userNotFound: boolean = false;
    loading: boolean = true;
    followingCount: number = 0;
    followerCount: number = 0;
    paginator: Paginator;

    constructor(
        private route: ActivatedRoute,
        private nostrService: NostrService,
        private signerService: SignerService
    ) {
        this.npub = this.route.snapshot.paramMap.get('npub') || "";
        if (this.npub === "") {
            this.npub = this.signerService.npub();
        }
        console.log(this.npub);
        this.paginator = new Paginator(0, 24*60, 24*60);
        route.params.subscribe(val => {
            this.user = null;
            this.posts = [];
            if (val) {
                this.npub = val["npub"];
            } else {
                this.npub = this.signerService.npub();
            }
            this.paginator = new Paginator(0, 24*60, 24*60);
            this.getUser();
        });
    }

    toggleLoading = () => this.loading = !this.loading;

    ngOnInit() {
        this.getUser();
    }

    async onScroll() {
        if (this.user) {
            this.getUserPosts(this.user);
        }
    }

    async getFollowingCount() {
        if (this.user) {
            this.followingCount = await this.nostrService.getFollowingCount(this.user.pubkey);
        }
    }

    async getFollowerCount() {
        if (this.user) {
            this.followerCount = await this.nostrService.getFollowerCount(this.user.pubkey);
        }
    }

    async getUser() {
        if (this.npub === undefined) {
            this.npub = this.signerService.npub();
        }
        const pubkey: string = nip19.decode(this.npub).data.toString();
        this.user = await this.nostrService.getUser(pubkey);
        console.log(this.user);
        if (this.user) {
            this.getUserPosts(this.user);
        } else {
            this.userNotFound = true;
            this.loading = false;
        }
    }

    async getUserPosts(user: User) {
        this.loading = true;
        let posts: Post[] = await this.nostrService.getUserPosts(
            user.pubkey,
            this.paginator.since,
            this.paginator.until
        );
        this.queryForMorePostInfo(user, posts)
    }

    async queryForMorePostInfo(user: User, posts: Post[]) {
        let noteIds: string[] = [];
        posts.forEach(p => {
            noteIds.push(p.noteId)
            if (p.nip10Result.root) {
                noteIds.push(p.nip10Result.root.id)
            }
        })
        console.log(noteIds);
        let replyFilter: Filter = {
            kinds: [1], "#e": noteIds
        }
        this.posts.push(...posts);
        this.posts.sort((a,b) => a.createdAt - b.createdAt).reverse();
        this.paginator.incrementFilterTimes(this.posts);
        let replies = await this.nostrService.getKind1(replyFilter)
        this.patchPostsWithMoreInfo(posts, replies);
        this.posts = this.posts.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.noteId === value.noteId
            ))
        )
        this.loading = false;
    }

    patchPostsWithMoreInfo(posts: Post[], replies: Post[]) {
        let counts: {[id: string]: number} = {}
        for (const r of replies) {
            if (r.nip10Result?.reply?.id) {
                counts[r.nip10Result.reply.id] = counts[r.nip10Result.reply.id] ? counts[r.nip10Result.reply.id] + 1 : 1;
            }
        }
        posts.forEach(p => {
            console.log(p);
            if (p.isARepost) {
                console.log("is a repost")
                if (p.nip10Result.root) {
                    console.log("has a root")
                    const rootId = p.nip10Result.root.id
                    console.log(rootId);
                    let reposts = replies.filter(r => {
                        console.log(r.noteId);
                        return r.noteId === rootId;
                    });
                    console.log("responsts")
                    console.log(reposts)
                    if (reposts) {
                        const repost = reposts[0];
                        console.log(repost)
                        console.log(p.content)
                        p.content = p.content.replace(`nostr:${p.nostrEventId}`, new Content(1, repost.content, repost.nip10Result).getParsedContent())
                        console.log(p.content)
                    }
                }
            }
            p.setReplyCount(counts[p.noteId]);
        });
    }
}
