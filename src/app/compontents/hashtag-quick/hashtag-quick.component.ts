import { Component, OnInit, Inject } from '@angular/core';
import { Filter } from 'nostr-tools';
import { Post } from 'src/app/types/post';
import { NostrService } from 'src/app/services/nostr.service';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { PostComponent } from 'src/app/components/post/post.component';

@Component({
  selector: 'app-hashtag-quick',
  templateUrl: './hashtag-quick.component.html',
  styleUrls: ['./hashtag-quick.component.css']
})
export class HashtagQuickComponent implements OnInit {

    hashtag: string;
    posts: Post[] = [];
    constructor(
        private nostrService: NostrService,
        private _bottomSheetRef: MatBottomSheetRef<PostComponent>,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: JSON,
    ) { 
        this.hashtag = data['hashtag'];
        this.getHashtagPosts();
    }

    ngOnInit(): void {}

    exitBottomSheet() {
        this._bottomSheetRef.dismiss();
    }

    patchPostsWithUserInfo(posts: Post[]) {
        posts.forEach(p => {
            p.setPicture(p.pubkey);
            p.setUsername(p.pubkey);
        });
    }

    async queryForAuthorNames(posts: Post[]) {
        let pubkeys: string[] = [];
        posts.forEach(p => {
            pubkeys.push(p.pubkey);
        })
        await this.nostrService.getKind0({kinds: [0], authors: pubkeys})
        this.posts.push(...posts);
        this.patchPostsWithUserInfo(posts);
    }

    async getHashtagPosts() {
        this.posts = [];
        let filter: Filter = {
            kinds: [1],
            limit: 50,
            "#t": [this.hashtag]
        }
        let waitPosts: Post[] = await this.nostrService.getKind1(filter);
        this.queryForAuthorNames(waitPosts);
    }
}
