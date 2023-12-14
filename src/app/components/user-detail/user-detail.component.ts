import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NostrService } from 'src/app/services/nostr.service';
import { User, dbUserToUser, DBUser  } from '../../types/user';
import { Post } from '../../types/post';
import { nip19 } from 'nostr-tools';
import { Paginator } from 'src/app/utils';
import { SignerService } from 'src/app/services/signer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Nip05Service } from 'src/app/services/nip05.service';
import { ImageDialogComponent } from '../image-dialog/image-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Filter, Event } from 'nostr-tools';
import { NgxIndexedDBService } from 'ngx-indexed-db';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class UserDetailComponent implements OnInit {
    welcomeMessage: string = "Welcome to the nostr network. Create a profile or start exploring";
    user: User | null = null;
    npub: string = "";
    posts: Post[] = [];
    userNotFound: boolean = false;
    loading: boolean = true;
    followingCount: number = 0;
    followerCount: number = 0;
    paginator: Paginator;
    viewingSelf: boolean = false;
    nip05Verified: boolean = false;
    myLikedNoteIds: string[] = [];

    constructor(
        private route: ActivatedRoute,
        private nostrService: NostrService,
        private signerService: SignerService,
        private snackBar: MatSnackBar,
        private router: Router,
        private nip05: Nip05Service,
        private dialog: MatDialog,
        private dbService: NgxIndexedDBService,
    ) {
        this.npub = this.route.snapshot.paramMap.get('npub') || "";
        if (this.npub === "") {
            this.viewingSelf = true;
            this.npub = this.signerService.npub();
        }
        this.paginator = new Paginator(0, 24*60, 24*60);
        route.params.subscribe(val => {
            this.user = null;
            this.posts = [];
            this.viewingSelf = false;
            this.npub = val["npub"];
            if (this.npub === undefined) {
                this.viewingSelf = true;
                this.npub = this.signerService.npub();
            }
            this.paginator = new Paginator(0, 24*60*5, 24*60*5);
            this.getUser();
        });
    }

    ngOnInit() {
        this.getUser();
    }

    enlargeBanner() {
        this.dialog.open(ImageDialogComponent, {data: {picture: this.user.banner}});
    }

    signOut() {
        this.signerService.clearKeys();
        this.openSnackBar("Successfully signed out", "dismiss");
        this.router.navigate(["/login"]);
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
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
        this.dbService.getAll("users")
            .subscribe(async (results: DBUser[]) => {
                for(const u of results) {
                    console.log(u)
                    if (u === undefined) {
                        continue;
                    }
                    if (u.pubkey === pubkey) {
                        console.log("FOUND!")
                        this.user = dbUserToUser(u);
                        break;
                    }
                }
                if (this.user === null) {
                    this.user = await this.nostrService.getUser(pubkey);
                    if (this.user) {
                        this.verifyNIP05(this.user);
                        await this.getUserPosts(this.user);
                        //this.user = waitUser;
                    } else {
                        this.userNotFound = true;
                        this.loading = false;
                    }
                }
            });
    }

    verifyNIP05(user: User) {
        if (user && user.nip05) {
            this.nip05.getNIP05(user.nip05)
                .subscribe(response => {
                    if (user && user.name) {
                        const nip05Pub: any = response.names[user.name]
                        if (nip05Pub === user.pubkey) {
                            this.nip05Verified = true;
                        }
                    }
                });
        }
    }

    async getUserPosts(user: User) {
        let posts: Post[] = await this.nostrService.getUserPosts(
            user.pubkey,
            this.paginator.since,
            this.paginator.until
        );
        await this.queryForMorePostInfo(user, posts)
    }

    async getMyLikes(pubkeys: string[]) {
        this.myLikedNoteIds = await this.nostrService.getEventLikes(pubkeys);
    }

    async queryForMorePostInfo(user: User, posts: Post[]) {

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
        this.loading = false;
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
