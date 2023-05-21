import { Component, Input, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { Post, LightningResponse, LightningInvoice, Zap, ZapRequest } from '../../types/post';
import { NostrService } from 'src/app/services/nostr.service';
import { getEventHash, Event } from 'nostr-tools';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { User } from 'src/app/types/user';
import { bech32 } from '@scure/base'
import { LightningService } from 'src/app/services/lightning.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { distinctUntilChanged } from 'rxjs/operators';
import { decode } from "@gandlaf21/bolt11-decode";


@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css'],
  encapsulation: ViewEncapsulation.None, // allows us to style hashtags on frontend
})
export class PostComponent implements OnInit {
    @ViewChild('canvas') canvas?: HTMLCanvasElement;
    @Input() root?: Post;
    @Input() post?: Post;
    @Input() zaps?: Zap[];
    @Input() zapsCount?: number;
    @Input() inPostDetail?: boolean;
    viewingRoot: boolean = false;
    rootEvent: string = "";
    replyContent: string = "";
    showReplyForm: boolean = false;
    showZapForm: boolean = false;
    user: User | null = null;
    lightningResponse: LightningResponse | null = null;
    lightningInvoice: LightningInvoice | null = null;
    sats: string;
    paymentInvoice: string = "";
    invoiceAmount: string = "?";
    displayQRCode: boolean = false;
    showInvoiceSection: boolean = false;
    smallScreen: boolean = false;
    Breakpoints = Breakpoints;
    currentBreakpoint:string = '';

    readonly breakpoint$ = this.breakpointObserver
        .observe([Breakpoints.Large, Breakpoints.Medium, Breakpoints.Small, '(min-width: 500px)'])
        .pipe(distinctUntilChanged());

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService,
        private clipboard: Clipboard,
        private snackBar: MatSnackBar,
        private router: Router,
        private lightning: LightningService,
        private breakpointObserver: BreakpointObserver
    ) {
        this.sats = this.signerService.getDefaultZap();
    }

    ngOnInit() {
        this.breakpoint$.subscribe(() => {
            this.breakpointChanged()
        });
        if (this.root?.noteId === this.post?.nip10Result?.root?.id) {
            this.viewingRoot = true;
        }
        if (this.post) {
            this.rootEvent = this.post.nip10Result?.root?.id || "";
        }
        console.log(this.inPostDetail)
        if (this.inPostDetail === undefined) {
            this.inPostDetail = false;
        } else {
            this.inPostDetail = true;
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

    showEventJson() {
        console.log(this.post);
    }

    async addToMuteList() {
        if (this.post) {
            await this.nostrService.addToMuteList(this.post.pubkey);
            this.openSnackBar("Added to Mute List", "Dismiss");
        }
    }

    setInvoiceAmount(invoice: string) {
        if (invoice) {
            const decodedInvoice = decode(invoice);
            for (let s of decodedInvoice.sections) {
                if (s.name === "amount") {
                    this.invoiceAmount = String(Number(s.value)/1000);
                    break;
                }
            }
        }
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
        if (element.nodeName === "BUTTON") {
            e.preventDefault();
            if (element && element.parentNode && element.parentNode.firstChild?.textContent) {
                let invoice = element.parentNode.firstChild.textContent;
                if ( this.lightning.hasWebln()) {
                    await this.payInvoice(invoice);
                } else {
                    this.copyAny(invoice);
                }
            }
        }
    }

    copynpub() {
        if (this.post) {
            this.clipboard.copy(this.post.npub);
            this.openSnackBar("npub copied!", "dismiss");
        }
    }

    copyLink() {
        if (this.post) {
            let link = `https://npubkey.github.io/#/posts/${this.post.nostrEventId}`;
            this.clipboard.copy(link);
            this.openSnackBar("link copied", "dismiss");
        }
    }

    async zap() {
        if (this.user === null && this.post) {
            this.user = await this.nostrService.getUser(this.post.pubkey);
        }
        if (this.user && (this.user.lud06 || this.user.lud16)) {
            this.openSnackBar("user can receive zaps", "dismiss");
            this.getLightningInfo();
        } else {
            this.openSnackBar("user can't recieve zaps", "dismiss");
        }
    }

    getLightningInfo() {
        let lightningAddress = "";
        if (this.user && this.user.lud06) {
            let {prefix, words} = bech32.decode(this.user.lud06, 5000)
            let data = new Uint8Array(bech32.fromWords(words))
            lightningAddress =  new TextDecoder().decode(Uint8Array.from(data));
        }
        else if (this.user && this.user.lud16) {
            lightningAddress = this.lightning.getLightningAddress(this.user.lud16);
        }
        if (lightningAddress !== "") {
            this.lightning.getLightning(lightningAddress)
            .subscribe(response => {
                this.lightningResponse = response;
                console.log(response);
                if (this.lightningResponse.status && this.lightningResponse.status == "Failed") {
                    this.showZapForm = false;
                    this.openSnackBar("Failed to lookup lightning address", "dismiss");
                } else if (this.lightningResponse.callback) {
                    this.showZapForm = true;
                } else {
                    this.showZapForm = false;
                    this.openSnackBar("couldn't find users lightning address", "dismiss");
                }
            });
        } else {
            this.openSnackBar("No lightning address found", "dismiss");
        }
    }

    showQRCode() {
        if (this.displayQRCode) {
            this.displayQRCode = false;
        } else {
            this.displayQRCode = true;
        }
    }

    hideInvoice() {
        this.showInvoiceSection = false;
    }

    copyInvoice() {
        if (this.paymentInvoice) {
            this.clipboard.copy(this.paymentInvoice);
            this.openSnackBar("Invoice copied", "dismiss");
        }
    }

    copyAny(any: string) {
        this.clipboard.copy(any);
        this.openSnackBar("Invoice copied", "dismiss");
    }

    sendZap() {
        console.log(this.lightningResponse)
        console.log(this.lightningResponse?.allowsNostr)
        console.log(this.lightningResponse?.nostrPubkey)
        if (this.lightningResponse?.allowsNostr && this.lightningResponse.nostrPubkey) {
            // should also check if nostrPubkey is valid
            console.log("can be nostr aware zap");
            this.createZapRequest();
        } else {
            this.getLightningInvoice(String(Number(this.sats)*1000));
        }
    }

    async createZapRequest() {
        if (this.post && this.lightningResponse?.callback) {
            const privateKey = this.signerService.getPrivateKey();
            let finalContent: string = "Zap!";
            let lnurl;
            if (this.user && this.user.lud06) {
                lnurl = this.user.lud06
            } else {
                lnurl = ""; // todo decode callback to lnurl
            }
            const amount = String(Number(this.sats)*1000)
            let tags: string[][] = [
                ["relays", this.signerService.getRelay()],
                ["amount", amount],
                ["lnurl", lnurl],
                ["p", this.post.pubkey],
                ["e", this.post.noteId]
            ]
            let unsignedEvent = this.nostrService.getUnsignedEvent(9734, tags, finalContent);
            let signedEvent: Event;
            if (privateKey !== "") {
                let eventId = getEventHash(unsignedEvent)
                signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
            } else {
                signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
            }
            this.lightning.sendZapRequest(this.lightningResponse.callback, signedEvent, amount, lnurl)
                .subscribe(response => {
                    console.log(response);
                    this.lightningInvoice = response;
                    this.paymentInvoice = this.lightningInvoice.pr;
                    this.setInvoiceAmount(this.paymentInvoice);
                    this.showZapForm = false;
                    this.showInvoiceSection = true;
                    this.payInvoice(this.paymentInvoice);
                });
        }
    }

    async getLightningInvoice(amount: string) {
        if (this.lightningResponse && this.lightningResponse.callback) {
            this.lightning.getLightningInvoice(this.lightningResponse.callback, amount)
            .subscribe(response => {
                this.lightningInvoice = response;
                this.paymentInvoice = this.lightningInvoice.pr;
                this.setInvoiceAmount(this.paymentInvoice);
                this.showZapForm = false;
                this.showInvoiceSection = true;
                this.payInvoice(this.paymentInvoice);
            });
        }
    }

    async payInvoice(invoice: string) {
        let paid = false;
        paid = await this.lightning.payInvoice(invoice);
        if (paid) {
            this.openSnackBar("Zapped!", "dismiss");
            this.hideInvoice();
        } else {
            this.openSnackBar("Payment Failed", "dismiss");
            this.copyAny(invoice);
        }
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

    clickShowReplyForm() {
        if (this.showReplyForm) {
            this.showReplyForm = false;
        } else {
            this.showReplyForm = true;
            this.showZapForm = false;
        }
    }

    async sendReply() {
        if (this.post) {
            const privateKey = this.signerService.getPrivateKey();
            let tags: string[][] = [];
            if (this.rootEvent) {
                if (this.rootEvent !== this.post.noteId) {
                    tags.push(["e", this.rootEvent, "", "root"])
                    tags.push(["e", this.post.noteId, "", "reply"])
                }
            } else {
                tags.push(["e", this.post.noteId, "", "root"])
            }
            tags.push(["p", this.post.pubkey]);
            let unsignedEvent = this.nostrService.getUnsignedEvent(1, tags, this.replyContent);
            let signedEvent: Event;
            if (privateKey !== "") {
                let eventId = getEventHash(unsignedEvent)
                signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
            } else {
                signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
            }
            this.nostrService.sendEvent(signedEvent);
            this.replyContent = "";
            this.openSnackBar("Reply Sent!", "Dismiss");
            this.showReplyForm = false;
        }
    }

    async repost() {
        if (this.post) {
            const privateKey = this.signerService.getPrivateKey();
            let tags = [
                ["e", this.post.noteId, ""],
                ["p", this.post.pubkey]
            ]
            let unsignedEvent = this.nostrService.getUnsignedEvent(6, tags, "");
            let signedEvent: Event;
            if (privateKey !== "") {
                let eventId = getEventHash(unsignedEvent)
                signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
            } else {
                signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
            }
            this.nostrService.sendEvent(signedEvent);
            this.openSnackBar("Repost Sent!", "Dismiss");
            this.showReplyForm = false;
        }
    }
}
