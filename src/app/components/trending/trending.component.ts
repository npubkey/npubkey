import { Component } from '@angular/core';
import { NostrBandApiService } from 'src/app/services/nostr-band-api.service';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from 'src/app/types/user';
import { Post } from 'src/app/types/post';

@Component({
  selector: 'app-trending',
  templateUrl: './trending.component.html',
  styleUrls: ['./trending.component.css']
})
export class TrendingComponent {

    users: Array<User> = [];
    posts: Array<Post> = [];

    constructor(
        private apiService: NostrBandApiService,
        private nostrService: NostrService
    ) {}

    getTrendingProfiles() {
        this.users = this.apiService.getTrendingProfiles();
        this.nostrService.storeUsersInDB(this.users);
        console.log(this.users);
    }

    getTrendingPosts() {
        this.posts = this.apiService.getTrendingNotes();
    }
}
