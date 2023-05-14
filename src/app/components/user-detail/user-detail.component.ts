import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from '../../types/user';
import { Post } from '../../types/post';
import { Filter, Event} from 'nostr-tools';
import { nip19 } from 'nostr-tools';

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
    loadingPosts: boolean = true;
    followingCount: number = 0;
    followerCount: number = 0;

    constructor(
        private route: ActivatedRoute,
        private nostrService: NostrService) {
            this.npub = this.route.snapshot.paramMap.get('npub') || "";
            route.params.subscribe(val => {
                console.log(val);
                this.npub = val["npub"];
                this.getUser();
            });
        }

    ngOnInit() {
        this.getUser();
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
        const pubkey: string = nip19.decode(this.npub).data.toString();
        this.user = await this.nostrService.getUser(pubkey);
        if (this.user) {
            this.getUserPosts(this.user);
        } else {
            this.userNotFound = true;
            this.loadingPosts = false;
        }
    }

    async getUserPosts(user: User) {
        let posts: Post[] = await this.nostrService.getUserPosts(user.pubkey)
        this.queryForMorePostInfo(user, posts)
    }

    async queryForMorePostInfo(user: User, posts: Post[]) {
        let noteIds: string[] = [];
        posts.forEach(p => {
            noteIds.push(p.noteId)
        })
        let replyFilter: Filter = {
            kinds: [1], "#e": noteIds
        }
        this.posts.push(...posts);
        let replies = await this.nostrService.getKind1(replyFilter)
        this.patchPostsWithMoreInfo(posts, replies);
        this.loadingPosts = false;
    }

    patchPostsWithMoreInfo(posts: Post[], replies: Post[]) {
        let counts: {[id: string]: number} = {}
        for (const r of replies) {
            if (r.nip10Result?.reply?.id) {
                counts[r.nip10Result.reply.id] = counts[r.nip10Result.reply.id] ? counts[r.nip10Result.reply.id] + 1 : 1;
            }
        }
        posts.forEach(p => {
            p.setReplyCount(counts[p.noteId]);
        });
    }
}
