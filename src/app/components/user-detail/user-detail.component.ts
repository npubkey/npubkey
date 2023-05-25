import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from '../../types/user';
import { Post } from '../../types/post';
import { nip19 } from 'nostr-tools';
import { Paginator } from 'src/app/utils';
import { SignerService } from 'src/app/services/signer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Nip05Service } from 'src/app/services/nip05.service';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
    welcomeMessage: string = "Welcome to the nostr network. Create a profile or start looking around";
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

    constructor(
        private route: ActivatedRoute,
        private nostrService: NostrService,
        private signerService: SignerService,
        private snackBar: MatSnackBar,
        private router: Router,
        private nip05: Nip05Service
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
            this.paginator = new Paginator(0, 24*60, 24*60);
            this.getUser();
        });
    }

    toggleLoading = () => this.loading = !this.loading;

    ngOnInit() {
        this.getUser();
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
        this.loading = true;
        let posts: Post[] = await this.nostrService.getUserPosts(
            user.pubkey,
            this.paginator.since,
            this.paginator.until
        );
        this.queryForMorePostInfo(user, posts)
    }

    async queryForMorePostInfo(user: User, posts: Post[]) {
        this.paginator.incrementFilterTimes(this.posts);
        this.posts.push(...posts);
        this.posts = this.posts.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.noteId === value.noteId
            ))
        )
        this.loading = false;
    }
}
