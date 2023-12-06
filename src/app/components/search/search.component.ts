import { Component, OnInit, AfterViewInit, ElementRef, Renderer2, ViewChild } from '@angular/core';
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
export class SearchComponent implements OnInit, AfterViewInit {
    @ViewChild('tradingview') tradingview?: ElementRef;
    loading: boolean = false;
    search: string = "";
    posts: Post[] = [];
    paginator: Paginator;

    searchCanHaveChart: boolean = false;

    constructor(
        private nostrService: NostrService,
        private router: Router,
        private _renderer2: Renderer2
    ) {
        let baseTimeDiff = 60;
        let since = 60;
        this.paginator = new Paginator(0, since, baseTimeDiff=baseTimeDiff);
    }

    ngOnInit(): void {
        this.getPosts();
    }

    ngAfterViewInit(): void {
        let script = this._renderer2.createElement('script');
        script.type = `text/javascript`;
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
        script.text = `
            {
                "symbol": "COINBASE:BTCUSD",
                "width": "100%",
                "height": "100%",
                "locale": "en",
                "dateRange": "1M",
                "colorTheme": "dark",
                "isTransparent": false,
                "autosize": true,
                "largeChartUrl": "",
                "noTimeScale": false,
                "chartOnly": false
            }`;
        this.tradingview?.nativeElement.appendChild(script);
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
        this.setSearchCanHaveChart();
        this.searchForPosts();
    }

    setSearchCanHaveChart() {
        console.log("CHECKING FOR CHART");
        const ok = this.search.toLowerCase()
        console.log(ok)
        console.log(ok.includes("bitcoin"));
        if (ok.includes("bitcoin")) {
            this.searchCanHaveChart = true;
        } else {
            this.searchCanHaveChart = false;
        }
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
