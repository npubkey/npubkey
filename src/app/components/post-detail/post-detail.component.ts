import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NostrService } from 'src/app/services/nostr.service';
import { Filter } from 'nostr-tools';
import { Post } from 'src/app/types/post';
import { nip19 } from 'nostr-tools';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css']
})
export class PostDetailComponent implements OnInit {

    nevent: string;
    post: Post | undefined;

    constructor(
        private route: ActivatedRoute,
        private nostrService: NostrService) {
            this.nevent = this.route.snapshot.paramMap.get('nevent') || "";
            route.params.subscribe(val => {
                console.log(val);
                this.nevent = val["nevent"];
                this.getPost();
            });
    }

    ngOnInit(): void {
        
    }

    async getPost() {
        let event = nip19.decode(this.nevent).data as nip19.EventPointer;
        let filter: Filter = {ids: [event.id], kinds: [1], limit: 1}
        let postList: Post[] = await this.nostrService.getKind1(filter);
        this.post = postList[0];
    }
}
