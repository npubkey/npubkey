import { Component, OnInit } from '@angular/core';
import { Filter } from 'nostr-tools';
import { Post } from 'src/app/types/post';
import { NostrService } from 'src/app/services/nostr.service';
import { Paginator } from 'src/app/utils';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

    loading: boolean = false;
    search: string = "";
    posts: Post[] = [];
    paginator: Paginator;

    constructor(
        private nostrService: NostrService
    ) {
        let baseTimeDiff = 60;
        let since = 60;
        this.paginator = new Paginator(0, since, baseTimeDiff=baseTimeDiff);
    }

    ngOnInit() {
        this.getPosts();
    }

    async getPosts() {
        let filter = this.getFilter();
        this.loading = true;
        this.posts = await this.nostrService.getKind1(filter);
        this.loading = false;
    }

    async onScroll() {
        this.getPosts();
    }

    getFilter(): Filter {
        let filter: Filter = {};
        // explore
        filter.kinds = [1];
        filter.limit = 100;
        filter.since = this.paginator.since;
        filter.until = this.paginator.until;
        if (this.search) {
            let tags = this.search.split(' ');
            filter["#t"] = tags
        }
        return filter;
    }

    submit() {
        this.loading = true;
        this.searchForPosts();
    }

    getPictureFromPublicKey(pubkey: string): string {
        return localStorage.getItem(`${pubkey}_img`) || "";
    }

    async searchForPosts() {
        let filter = this.getFilter();
        this.posts = [];
        this.posts = await this.nostrService.getKind1(filter);
        this.loading = false;
    }
}
