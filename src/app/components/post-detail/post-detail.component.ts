import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NostrService } from 'src/app/services/nostr.service';
import { Filter } from 'nostr-tools';
import { Post } from 'src/app/types/post';
import { nip19 } from 'nostr-tools';

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
        if (this.post && this.post.nip10Result.root) {
            // query for the root event
            postList = await this.nostrService.getPostAndReplies(this.post.nip10Result.root.id)
        }
        this.addRoot(postList);
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
            let user = await this.nostrService.getUser(this.root.pubkey);
            if (user) {
                this.root.setPicture(user.pubkey);
                this.root.setUsername(user.pubkey);
            }
        }
    }

    addRoot(postList: Post[]): void {
        if (!this.post?.nip10Result.root) {
            this.root = undefined;
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
