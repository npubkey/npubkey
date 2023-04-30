import { Component, OnInit } from '@angular/core';
import {Event} from 'nostr-tools';
import { NostrServiceService } from 'src/app/services/nostr-service.service';
@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {

    events: Event[] = [];

    constructor(private nostrService: NostrServiceService) {}

    ngOnInit() {
        this.getEvents();
    }

    async getEvents() {
        let limit = 10;
        this.events = await this.nostrService.getKind1(limit);
        console.log(this.events);
    }
}
