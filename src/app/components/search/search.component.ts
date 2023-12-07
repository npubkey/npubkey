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
export class SearchComponent implements OnInit {
    @ViewChild('tradingview') tradingview?: ElementRef;
    loading: boolean = false;
    search: string = "";
    posts: Post[] = [];
    paginator: Paginator;

    searchCanHaveChart: boolean = false;

    constructor(
        private nostrService: NostrService,
        private router: Router,
        private _renderer2: Renderer2,
        private el: ElementRef
    ) {
        let baseTimeDiff = 60;
        let since = 60;
        this.paginator = new Paginator(0, since, baseTimeDiff=baseTimeDiff);
    }

    ngOnInit(): void {
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
        this.setSearchCanHaveChart();
        this.searchForPosts();
    }

    setSearchCanHaveChart() {
        const ok = this.search.toLowerCase()
        console.log(ok)
        console.log(ok.includes("bitcoin"));
        if (ok.startsWith("$") || ok.includes("bitcoin")) {
            let symbol = this.getSymbol(ok);
            this.injectTradingViewChart(symbol)
            this.searchCanHaveChart = true;
        } else {
            this.searchCanHaveChart = false;
        }
    }

    getSymbol(value: string): string {
        if (value.includes("bitcoin") || value.includes("btc")) {
            return "BITSTAMP:BTCUSD";
        }
        if (value.startsWith("$")) {
            console.log('maybe stock');
            return `NASDAQ:${value.substring(1)}`;
        }
        return value;
    }

    injectTradingViewChart(symbol: string) {
        // idk why this works but I don't care
        Array.from(this.tradingview.nativeElement.children).forEach(child => {
            console.log('children.length=' + this.tradingview.nativeElement.children.length);
            this._renderer2.removeChild(this.tradingview.nativeElement, child);
       }); 
        //this._renderer2.removeChild(this.tradingview.nativeElement, 'script');
        let script = this._renderer2.createElement('script');
        script.type = `text/javascript`;
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
        script.text = `
            {
                "symbol": "${symbol}",
                "width": "100%",
                "height": "100%",
                "locale": "en",
                "dateRange": "1D",
                "colorTheme": "light",
                "isTransparent": false,
                "autosize": true,
                "largeChartUrl": "",
                "noTimeScale": false,
                "chartOnly": false
            }`;
        this.tradingview?.nativeElement.appendChild(script);
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
