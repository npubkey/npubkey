import { Component, OnInit } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { distinctUntilChanged, tap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
    title: string = 'npubkey';
    home_icon: string = 'home';
    key_icon: string = "key";
    explore_icon: string = 'explore';
    users_icon: string = 'people_outline';
    create_icon: string = 'add_photo_alternate';
    menu_icon: string = 'account_circle';
    messages_icon: string = 'forum';
    notifications_icon: string = 'notifications';
    search_icon: string = 'search';
    smallScreen: boolean = false;
    Breakpoints = Breakpoints;
    currentBreakpoint: string = '';
    showHeader: boolean = true;

    readonly breakpoint$ = this.breakpointObserver
        .observe([Breakpoints.XLarge, Breakpoints.Large, Breakpoints.Medium, Breakpoints.Small, Breakpoints.XSmall])
        .pipe(
        tap(value => console.log(value)),
        distinctUntilChanged()
    );

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService,
        private breakpointObserver: BreakpointObserver
    ) {
    }

    ngOnInit(): void {
        // because the header will always be on the screen,
        // put some stuff in here we want on start
        this.breakpoint$.subscribe(() => {
            this.breakpointChanged()
        });
        let pubkey = this.signerService.getPublicKey();
        if (pubkey) {
            // poorly named but this will save our following list
            this.nostrService.getContactList(pubkey);
        }
    }

    private breakpointChanged() {
        if(this.breakpointObserver.isMatched(Breakpoints.XLarge)) {
            this.currentBreakpoint = Breakpoints.Large;
            this.smallScreen = false;
        } else if(this.breakpointObserver.isMatched(Breakpoints.Large)) {
            this.currentBreakpoint = Breakpoints.Large;
            this.smallScreen = false;
        } else if(this.breakpointObserver.isMatched(Breakpoints.Medium)) {
            this.currentBreakpoint = Breakpoints.Medium;
            this.smallScreen = false;
        } else if(this.breakpointObserver.isMatched(Breakpoints.Small)) {
            this.currentBreakpoint = Breakpoints.Small;
            this.smallScreen = true;
        } else if(this.breakpointObserver.isMatched(Breakpoints.XSmall)) {
            this.currentBreakpoint = Breakpoints.XSmall;
            this.smallScreen = true;
        }
    }
}
