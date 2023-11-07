import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NostrService } from 'src/app/services/nostr.service';
import { Post, Zap } from 'src/app/types/post';
import { User } from 'src/app/types/user';
import { nip19, Filter } from 'nostr-tools';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css'],
})
export class PostDetailComponent implements OnInit {

    loading: boolean = true;
    nevent: string;
    post: Post | undefined;
    root: Post | undefined;
    event: nip19.EventPointer;
    replies: Post[] = [];
    postNotFound: boolean = false;
    postZaps: Zap[] = [];
    postZapsCount: number = 0;
    postLikesCount: number = 0;
    user: User | null = null;

    constructor(
        private route: ActivatedRoute,
        private nostrService: NostrService,
    ) {
        this.nevent = this.route.snapshot.paramMap.get('nevent') || "";
        this.event = nip19.decode(this.nevent).data as nip19.EventPointer;
        route.params.subscribe(val => {
            this.replies = [];
            this.post = undefined;
            this.root = undefined;
            this.nevent = val["nevent"];
            this.event = nip19.decode(this.nevent).data as nip19.EventPointer;
            this.getPost();
        });
    }

    ngOnInit(): void {}

    async getPost() {
        this.post = await this.nostrService.getPost(this.event.id);
        if (this.post === undefined) {
            this.root = undefined;
            this.replies = [];
            this.loading = false;
            this.postNotFound = true;
            return;
        }
        let postList: Post[] = []
        let rootEventId;
        if (!this.post.nip10Result.root) {
            // query for the root event
            this.root = this.post;
            rootEventId = this.root.noteId;
        } else {
            rootEventId = this.post.nip10Result.root.id
        }
        postList = await this.nostrService.getPostAndReplies(rootEventId)
        if (this.root === undefined) {
            this.addRoot(postList);
        }
        this.getPostLikesCount()
        this.addReplies(postList);
        if (this.root) {
            this.getUser();
            this.root.setReplyCount(this.replies.length);
        } else {
            this.postNotFound = true;
        }
        if (this.post !== this.root) {
            this.replies.push(this.post);
        }
        this.replies.sort((a,b) => a.createdAt - b.createdAt);
        this.loading = false;
    }

    async getUser() {
        if (this.root) {
            this.user = await this.nostrService.getUser(this.root.pubkey);
            if (this.user) {
                this.root.setPicture(this.user.pubkey);
                this.root.setUsername(this.user.pubkey);
            }
            this.getPostZaps();
        }
    }

    async getPostZaps() {
        if (this.root) {
            let filter: Filter = {
                kinds: [9735],
                "#e": [this.root.noteId]
            }
            this.postZaps = await this.nostrService.getZaps(filter);
            if (this.postZaps.length > 0) {
                this.postZapsCount = this.postZaps.map(item => item.satAmount).reduce((prev, next) => prev + next);
            }
        }
    }

    async getPostLikesCount() {
        console.log("GETTING LIKES COUNT")
        if (this.root) {
            let filter: Filter = {
                kinds: [7],
                "#e": [this.root.noteId]
            }
            this.postLikesCount = await this.nostrService.getPostLikeCount(filter);
        }
        console.log(this.postLikesCount);
    }

    addRoot(postList: Post[]): void {
        if (!this.post?.nip10Result.root) {
            this.root = this.post;
            return;
        }
        for (let r of postList) {
            if (r.noteId === this.post.nip10Result.root.id) {
                this.root = r;
                return;
            }
        }
    }

    addReplies(postList: Post[]): void {
        for (let r of postList) {
            if (this.root) {
                if (this.root.noteId === r.noteId) {
                    continue;
                }
            }
            if (r.noteId != this.event.id) {
                this.replies.push(r);
            }
        }
    }
}
