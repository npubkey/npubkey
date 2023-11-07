import { Component, OnInit } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { distinctUntilChanged, tap } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
    MatBottomSheet,
    MatBottomSheetModule,
    MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { CreateEventComponent } from '../create-event/create-event.component';


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
    pubkey: string;
    userImage: string;
    notificationCount: number = 0;
    readonly breakpoint$ = this.breakpointObserver
        .observe([Breakpoints.XLarge, Breakpoints.Large, Breakpoints.Medium, Breakpoints.Small, Breakpoints.XSmall])
        .pipe(
        tap(value => console.log(value)),
        distinctUntilChanged()
    );

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService,
        private breakpointObserver: BreakpointObserver,
        private router: Router,
        private _bottomSheet: MatBottomSheet
    ) {
        this.pubkey = this.signerService.getPublicKey();
        this.userImage = this.signerService.getLoggedInUserImage();
        const relay = this.signerService.getRelay() // will get from storage or default
        this.signerService.setRelay(relay); // incase its not there
        if (this.pubkey) {
            // poorly named but this will save our following list
            this.getContactList(this.pubkey);
            this.getMuteList(this.pubkey);
        }
        this.getNotificationCount();
        router.events.pipe(
            filter(event => event instanceof NavigationEnd)  
        ).subscribe((event: NavigationEnd) => {
            // refresh user image on change to ensure its shown in header
            if (event.url === "/login") {
                this.userImage = "";
            } else {
                this.userImage = this.signerService.getLoggedInUserImage();
            }
        });
    }

    ngOnInit(): void {
        // because the header will always be on the screen,
        // put some stuff in here we want on start
        this.breakpoint$.subscribe(() => {
            this.breakpointChanged()
        });
    }

    openBottomSheet(): void {
        this._bottomSheet.open(CreateEventComponent);
    }

    async getNotificationCount() {
        const notifications = await this.nostrService.getNotifications();
        this.notificationCount = notifications.length;
    }

    async getContactList(pubkey: string) {
        await this.nostrService.getContactList(pubkey);
    }

    async getMuteList(pubkey: string) {
        await this.nostrService.getMuteList(pubkey);
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
