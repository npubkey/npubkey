import { Component, OnInit, OnDestroy, ViewEncapsulation, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from "../../types/user";
import { getEventHash, Event, nip19, nip04, Filter, Sub, nip10 } from 'nostr-tools';
import { SignerService } from 'src/app/services/signer.service';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { distinctUntilChanged } from 'rxjs/operators';
import { Content } from 'src/app/types/post';
import { Router } from '@angular/router';

interface Message {
    content: string;
    npub: string;
    createdAt: number;
}

@Component({
  selector: 'app-messenger',
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MessengerComponent implements OnInit, OnDestroy, AfterViewInit {
    pageLogs: string[] = []; // temporary debug for phone browser
    contactSelected: boolean = false;
    friendNPub: string;
    myNPub: string;
    content: string = "";
    messages: Message[] = [];
    pubkeyTag: string = "#p";
    friend: User | undefined;
    me: User | undefined;
    userNotFound: boolean = false;
    smallScreen: boolean = false;
    Breakpoints = Breakpoints;
    currentBreakpoint:string = '';
    subscription: Sub | null = null;
    userPubkey: string;
    friendPubkey: string;
    userPrivateKey: string;
    fake: nip10.NIP10Result;
    readonly breakpoint$ = this.breakpointObserver
        .observe([Breakpoints.Large, Breakpoints.Medium, Breakpoints.Small, '(min-width: 500px)'])
        .pipe(distinctUntilChanged());

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
        private breakpointObserver: BreakpointObserver,
        private cdRef: ChangeDetectorRef,
        private router: Router
    ) {
        this.fake = {
            reply: undefined,
            root: undefined,
            mentions: [],
            profiles: []
        }
        this.myNPub = this.signerService.npub();
        this.friendNPub = this.route.snapshot.paramMap.get('npub') || "";
        this.userPubkey = this.signerService.getPublicKey();
        this.friendPubkey = nip19.decode(this.friendNPub).data.toString();
        this.userPrivateKey = this.signerService.getPrivateKey();
        route.params.subscribe(val => {
            this.friendNPub = val["npub"];
            this.friendPubkey = nip19.decode(this.friendNPub).data.toString();
            this.getFriend()
            this.getMe();
            this.getMessages();
        });
    }

    ngOnInit(): void {
        this.breakpoint$.subscribe(() => {
            this.breakpointChanged()
        });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsub();
        }
    }

    ngAfterViewInit() {
        this.cdRef.detectChanges();
    }

    ngOnChanges() {
        this.cdRef.detectChanges();
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

    async getMe() {
        let why = await this.nostrService.getUser(this.signerService.getPublicKey());
        if (why) {
            this.me = why;
        }
    }

    async getFriend() {
        const pubkey: string = nip19.decode(this.friendNPub).data.toString();
        const filter: Filter = {authors: [pubkey], limit: 1}
        let users = await this.nostrService.getKind0(filter);
        if (users.length > 1) {
            this.friend = users[0];
        } else if (users.length === 0) {
            console.log("user not found"); // TODO: these should output info to the user
        } else {
            this.friend = users[0];
        }
        if (this.friend) {
            this.friend = users[0];
        } else {
            this.userNotFound = true;
        }
    }

    async getMessages() {
        let usToThem: Filter = {kinds: [4], authors: [this.userPubkey], "#p": [this.friendPubkey]}
        let themToUs: Filter = {kinds: [4], authors: [this.friendPubkey], "#p": [this.userPubkey]}
        let dmEvents: Event[] = await this.nostrService.getKind4(usToThem, themToUs)
        for (let dm of dmEvents) {
            this.addMessage(dm);
        }
        // TODO subscribe to any new messages while it is open
        this.listenToRelay([usToThem, themToUs]);
    }

    async addMessage(dm: Event) {
        let decryptedContent;
        if (this.userPubkey === dm.pubkey) {
            decryptedContent = await this.decryptCipherText(dm.tags[0][1], dm.content);
        } else {
            decryptedContent = await this.decryptCipherText(dm.pubkey, dm.content);
        }
        this.messages.push(
            {
                content: new Content(1, decryptedContent, this.fake).getParsedContent(),
                npub: nip19.npubEncode(dm.pubkey),
                createdAt: dm.created_at
            }
        );
        this.messages.sort((a,b) => a.createdAt - b.createdAt);
    }

    async processLinks(e: any) {
        // needed when we generate html from incoming text to
        // route a link without getting a 404
        const element: HTMLElement = e.target;
        if (element.nodeName === 'A') {
            e.preventDefault();
            const link = element.getAttribute('href');
            if (link) {
                this.router.navigate([link]).catch((error) => {
                    window.open(link, "_blank");
                });
            }
        }
    }

    async listenToRelay(filters: Filter[]) {
        const relay = await this.nostrService.relayConnect()
        // let's query for an event that exists
        this.subscription = relay.sub(filters);
        this.subscription.on('event', (dm: Event) => {
            this.addMessage(dm);
        });
    }

    encryptContent(pubkey: string, content: string) {
        if (this.signerService.usingNostrBrowserExtension()) {
            return this.signerService.signDMWithExtension(pubkey, content);
        }
        let privateKey = this.signerService.getPrivateKey()
        return nip04.encrypt(privateKey, pubkey, this.content);
    }

    async decryptCipherText(pubkey: string, content: string) {
        if (this.signerService.usingNostrBrowserExtension()) {
            return await this.signerService.decryptDMWithExtension(pubkey, content);
        }
        return this.signerService.decryptWithPrivateKey(pubkey, content);
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

    async sendEvent() {
        const toFriendContent: string = await this.encryptContent(this.friendPubkey, this.content);
        const toTags = [["p", this.friendPubkey]]
        let toFriendUnsignedEvent = this.nostrService.getUnsignedEvent(4, toTags, toFriendContent);
        let toFriendSignedEvent: Event;
        if (this.userPrivateKey !== "") {
            let toFriendEventId = getEventHash(toFriendUnsignedEvent)
            toFriendSignedEvent = this.nostrService.getSignedEvent(toFriendEventId, this.userPrivateKey, toFriendUnsignedEvent);
        } else {
            toFriendSignedEvent = await this.signerService.signEventWithExtension(toFriendUnsignedEvent);
        }
        this.nostrService.sendEvent(toFriendSignedEvent);
        this.openSnackBar("Message Sent!", "dismiss");
        this.content = "";
    }
}
