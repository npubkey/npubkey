import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NostrServiceService } from 'src/app/services/nostr-service.service';
import { User } from '../../types/user';
import { Post } from '../../types/post';
import { Filter, Event} from 'nostr-tools';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {

    user: User | undefined;
    posts: Post[] = [];

    constructor(
        private route: ActivatedRoute,
        private nostrService: NostrServiceService) {}

    ngOnInit() {
        this.getUser();
    }

    async getUser() {
        const publicKey = this.route.snapshot.paramMap.get('publicKey') || "";
        const filter: Filter = {authors: [publicKey], limit: 1}
        console.log(publicKey);
        let users = await this.nostrService.getKind0(filter);
        if (users.length !== 1) {
            console.log("more than one user found?")
        }
        console.log("DETAILED USERS?")
        console.log(users);
        this.user = users[0];
        this.getUserPosts(this.user);
    }

    async getUserPosts(user: User) {
        let filter: Filter = {
            kinds: [1],
            authors: [user.publicKey]
        }
        this.posts = await this.nostrService.getKind1(filter);
    }
}
