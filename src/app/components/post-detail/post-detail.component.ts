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
    event: nip19.EventPointer;
    replies: Post[] = [];

    constructor(
        private route: ActivatedRoute,
        private nostrService: NostrService,
    ) {
            this.nevent = this.route.snapshot.paramMap.get('nevent') || "";
            this.event = nip19.decode(this.nevent).data as nip19.EventPointer;
            route.params.subscribe(val => {
                console.log(val);
                this.nevent = val["nevent"];
                this.event = nip19.decode(this.nevent).data as nip19.EventPointer;
                this.getPost();
            });
    }

    ngOnInit(): void {}

    async getPost() {
        let postFilter: Filter = {
            ids: [this.event.id], kinds: [1], limit: 1
        }
        let replyFilter: Filter = {
            kinds: [1], "#e": [this.event.id]
        }
        let postList: Post[] = await this.nostrService.getPostAndReplies([postFilter, replyFilter]);
        this.replies = []
        postList.forEach(r => {
            if (r.noteId === this.event.id) {
                this.post = r;
            }
            else if (r.nip10Result.root && r.nip10Result.root.id === this.event.id) {
                this.replies.push(r);
            }
        })
        this.replies.sort((a,b) => a.createdAt - b.createdAt);
        this.loading = false;
    }
}
