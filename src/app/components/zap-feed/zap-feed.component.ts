import { Component, OnInit, OnDestroy } from '@angular/core';
import { Post, Zap } from '../../types/post';
import { Filter, Sub, Event } from 'nostr-tools';
import { NostrService } from 'src/app/services/nostr.service';

@Component({
  selector: 'app-zap-feed',
  templateUrl: './zap-feed.component.html',
  styleUrls: ['./zap-feed.component.css']
})
export class ZapFeedComponent implements OnInit, OnDestroy {
    zaps: Zap[] = [];
    subscription: Sub | null = null;
    loading: boolean = true;

    constructor(
        private nostrService: NostrService,
    ) {}

    ngOnInit() {
        this.getZaps();
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsub();
        }
    }

    async getZaps() {
        let filter = this.getFilter();
        this.zaps = await this.nostrService.getZaps(filter);
        this.loading = false;
        console.log("GETTING ZAPS")
        console.log(this.zaps);
        this.listenForZaps();
    }

    getFilter() {
        let filter: Filter = {};
        filter.kinds = [9735];
        filter.limit = 50;
        return filter;
    }

    async listenForZaps() {
        const relay = await this.nostrService.relayConnect()
        // let's query for an event that exists
        const filter: Filter = {
            kinds: [9735],
            since: Math.floor(Date.now() / 1000)
        }
        this.subscription = relay.sub([filter]);
        this.subscription.on('event', (e: Event) => {
            this.zaps.unshift(new Zap(e.id, e.kind, e.pubkey, e.created_at, e.sig, e.tags));
        });
        this.subscription.on('eose', () => {
            console.log(`End of subscription events`)
        });
    }
}
