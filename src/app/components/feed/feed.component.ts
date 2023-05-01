import { Component, OnInit } from '@angular/core';
import { Event, Filter } from 'nostr-tools';
import { NostrServiceService } from 'src/app/services/nostr-service.service';
import { Post } from '../../types/post';


@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {

    posts: Post[] = [];

    constructor(private nostrService: NostrServiceService) {}

    ngOnInit() {
        this.getPosts();
    }

    async getPosts() {
        let filter: Filter = {limit: 20}
        this.posts = await this.nostrService.getKind1(filter);
        console.log("HOW")
        console.log(this.posts)
    }
}
