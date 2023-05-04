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

    user: User | undefined;
    npub: string = "";
    posts: Post[] = [];
    userNotFound: boolean = false;

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
        this.user = undefined;
        this.getUser();
    }

    async getUser() {
        const pubkey: string = nip19.decode(this.npub).data.toString();
        const filter: Filter = {authors: [pubkey], limit: 1}
        let users = await this.nostrService.getKind0(filter);
        if (users.length > 1) {
            console.log("more than one user found");
            this.user = users[0];
        } else if (users.length === 0) {
            console.log("user not found"); // TODO: these should output info to the user
        } else {
            this.user = users[0];
        }
        if (this.user) {
            this.user = users[0];
            this.getUserPosts(this.user);
        } else {
            this.userNotFound = true;
        }
    }

    async getUserPosts(user: User) {
        let filter: Filter = {
            kinds: [1],
            authors: [user.pubkey],
            limit: 50,
        }
        this.posts = await this.nostrService.getKind1(filter);
    }
}
