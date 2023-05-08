import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from "../../types/user";
import { getEventHash, Event, nip19, nip04, Filter } from 'nostr-tools';
import { SignerService } from 'src/app/services/signer.service';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { distinctUntilChanged, tap } from 'rxjs/operators';


interface Message {
    content: string;
    npub: string;
    createdAt: number;
}

@Component({
  selector: 'app-messenger',
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.css']
})
export class MessengerComponent implements OnInit {
    @ViewChild('messagesDiv') messagesDiv?: ElementRef<HTMLDivElement>;

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

    readonly breakpoint$ = this.breakpointObserver
        .observe([Breakpoints.Large, Breakpoints.Medium, Breakpoints.Small, '(min-width: 500px)'])
        .pipe(
        tap(value => console.log(value)),
        distinctUntilChanged()
    );

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
        private breakpointObserver: BreakpointObserver
    ) {
        this.myNPub = this.signerService.npub();
        this.friendNPub = this.route.snapshot.paramMap.get('npub') || "";
        route.params.subscribe(val => {
            this.friendNPub = val["npub"];
            this.getFriend()
            this.getMe();
            this.getMessages();
        });
    }

    ngOnInit(): void {
        this.breakpoint$.subscribe(() => {
            console.log("what?")
            this.breakpointChanged()
        });
    }

    private breakpointChanged() {
        console.log("breakpoints change")
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

    scrollBottom() {
        console.log("scrooling?")
        const maxScroll = this.messagesDiv?.nativeElement.scrollHeight;
        console.log(maxScroll);
        this.messagesDiv?.nativeElement.scrollTo({ top: maxScroll, behavior: 'smooth' });
        console.log(this.messagesDiv);
    }

    async getMe() {
        let filter: Filter = {authors: [this.signerService.getPublicKey()], kinds: [0], limit: 1}
        let why = await this.nostrService.getUser(filter);
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
        let fromPubKey = nip19.decode(this.friendNPub).data.toString();
        let toPubkey = this.signerService.getPublicKey()
        let filter: Filter = {kinds: [4], authors: [fromPubKey, toPubkey], "#p": [toPubkey]}
        let dmEvents: Event[] = await this.nostrService.getKind4(filter)
        console.log(dmEvents);
        for (let e in dmEvents) {
            let decryptedContent = await this.decryptCipherText(dmEvents[e].pubkey, dmEvents[e].content);
            this.messages.push(
                {
                    content: decryptedContent,
                    npub: nip19.npubEncode(dmEvents[e].pubkey),
                    createdAt: dmEvents[e].created_at
                }
            );
        }
        this.messages.sort((a,b) => a.createdAt - b.createdAt);
        this.scrollBottom();
    }

    encryptContent(pubkey: string, content: string) {
        if (this.signerService.usingNostrBrowserExtension()) {
            return this.signerService.signDMWithExtension(pubkey, content);
        }
        let privateKey = this.signerService.getPrivateKey()
        return nip04.encrypt(privateKey, pubkey, this.content);
    }

    decryptCipherText(pubkey: string, content: string) {
        if (this.signerService.usingNostrBrowserExtension()) {
            return this.signerService.decryptDMWithExtension(pubkey, content);
        }
        return this.signerService.decryptWithPrivateKey(pubkey, content);
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

    async sendEvent() {
        const privateKey = this.signerService.getPrivateKey();
        let toPubKey = nip19.decode(this.friendNPub).data.toString();
        let toFriendContent: string = await this.encryptContent(toPubKey, this.content);
        let selfPubkey = this.signerService.getPublicKey();
        let selfContent: string = await this.encryptContent(selfPubkey, this.content);
        let toTags = [["p", toPubKey]]
        let selfTags = [["p", selfPubkey]]
        let toFriendUnsignedEvent = this.nostrService.getUnsignedEvent(4, toTags, toFriendContent);
        let toSelfUnsignedEvent = this.nostrService.getUnsignedEvent(4, selfTags, selfContent);
        let toFriendSignedEvent: Event;
        let toSelfSignedEvent: Event;
        if (privateKey !== "") {
            let toFriendEventId = getEventHash(toFriendUnsignedEvent)
            let toSelfEventId = getEventHash(toSelfUnsignedEvent)
            toFriendSignedEvent = this.nostrService.getSignedEvent(toFriendEventId, privateKey, toFriendUnsignedEvent);
            toSelfSignedEvent = this.nostrService.getSignedEvent(toSelfEventId, privateKey, toSelfUnsignedEvent)
        } else {
            toFriendSignedEvent = await this.signerService.signEventWithExtension(toFriendUnsignedEvent);
            toSelfSignedEvent = await this.signerService.signEventWithExtension(toSelfUnsignedEvent);
        }
        this.nostrService.sendEvent(toFriendSignedEvent);
        this.nostrService.sendEvent(toSelfSignedEvent);
        this.openSnackBar("Message Sent!", "dismiss");
        this.content = "";
        this.scrollBottom()
    }
}
