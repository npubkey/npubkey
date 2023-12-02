import { Component, OnInit } from '@angular/core';
import { Filter } from 'nostr-tools';
import { Post } from 'src/app/types/post';
import { NostrService } from 'src/app/services/nostr.service';
import { Paginator } from 'src/app/utils';
import { Router } from '@angular/router';

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
        private nostrService: NostrService,
        private router: Router
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
        //search
        if (this.search) {
            let tags = this.search.split(' ');
            filter["#t"] = tags
            filter.limit = 100;
        } else {
            // global recent feed
            filter.kinds = [1];
            filter.limit = 100;
            filter.since = this.paginator.since;
            filter.until = this.paginator.until;
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
        if (this.search.startsWith("nevent")) {
            this.router.navigate([`/posts/${this.search}`])
        }
        let filter = this.getFilter();
        this.posts = [];
        this.posts = await this.nostrService.getKind1(filter);
        this.loading = false;
    }
}
