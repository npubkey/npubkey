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
import { GifService } from 'src/app/services/gif.service';
import { ImageServiceService } from 'src/app/services/image-service.service';
import { MatDialog } from '@angular/material/dialog';
import { ImageDialogComponent } from '../image-dialog/image-dialog.component';

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
    userReposted: boolean = false;
    canFollow: boolean = true;
    followText: string = "Follow";
    followList: string[];

    // create reply stuff
    gifSearch: string = "";
    gifsFound: string[] = [];
    selectedFiles?: FileList;
    selectedFileNames: string[] = [];
    showProgressBar: boolean = false;
    preview: string = "";

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
        private breakpointObserver: BreakpointObserver,
        private gifService: GifService,
        private imageService: ImageServiceService,
        private dialog: MatDialog
    ) {
        this.sats = this.signerService.getDefaultZap();
        this.followList = this.signerService.getFollowingList();
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
            if (this.followList.includes(this.post.pubkey)) {
                this.canFollow = false;
                this.followText = "Unfollow";
            } else {
                this.canFollow = true;
                this.followText = "Follow";
            }
        }
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

    enlargePicture(imgUrl: string) {
        if (!this.smallScreen) {
            this.dialog.open(ImageDialogComponent, {data: {picture: imgUrl}})
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
        if (element.nodeName === "IMG") {
            e.preventDefault();
            const imgUrl = element.getAttribute('src');
            if (imgUrl) {
                this.enlargePicture(imgUrl);
            }
        }
    }

    followUser() {
        if (this.canFollow) {
            this.sendFollowEvent();
            this.canFollow = false;
            this.followText = "Unfollow";
            this.openSnackBar("Followed user", "dismiss");
        } else {
            this.sendFollowEvent(true);
            this.canFollow = true;
            this.followText = "Follow";
            this.openSnackBar("Unfollowed user", "dismiss");
        }
    }

    async sendFollowEvent(unfollow=false) {
        if (this.post) {
            let tags: string[][] = this.signerService.getFollowingListAsTags()
            if (unfollow) {
                tags = tags.filter(tag => {
                    return tag[1] !== this.post?.pubkey
                });
            } else {
                tags.push(["p", this.post.pubkey, "wss://relay.damus.io/", this.post.username]);
            }
            this.signerService.setFollowingListFromTags(tags);
            let unsignedEvent = this.nostrService.getUnsignedEvent(3, tags, "");
            let signedEvent: Event;
            const privateKey = this.signerService.getPrivateKey();
            if (privateKey !== "") {
                let eventId = getEventHash(unsignedEvent)
                signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
            } else {
                signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
            }
            this.nostrService.sendEvent(signedEvent);
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
        if (this.lightningResponse?.allowsNostr && this.lightningResponse.nostrPubkey) {
            // should also check if nostrPubkey is valid
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

    addGifToPostContent(g: string) {
        this.replyContent = this.replyContent + " " + g;
        this.openSnackBar("GIF added!", "dismiss");
    }

    addImageToPostContent(imgUrl: string) {
        this.replyContent = this.replyContent + " " + imgUrl;
        this.openSnackBar("Image added!", "dismiss");
    }

    selectFiles(event: any): void {
        this.selectedFileNames = [];
        this.selectedFiles = event.target.files;
        if (this.selectedFiles && this.selectedFiles[0]) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.preview = e.target.result;
            };
            reader.readAsDataURL(this.selectedFiles[0]);
            this.selectedFileNames.push(this.selectedFiles[0].name);
        }
    }

    upload(file: File): void {
        if (file) {
          this.imageService.uploadImage(file)
            .subscribe(response => this.addImageToPostContent(response));
        }
    }

    uploadImage(): void {
        if (this.selectedFiles) {
            this.upload(this.selectedFiles[0]);
        }
    }

    async searchGif() {
        this.gifsFound = [];
        if (this.post) {
            const wow = await this.gifService.getTopGifs(this.gifSearch, "LIVDSRZULELA")
            wow.subscribe(response => {
                const results = response.results;
                results.forEach(gif => {
                    this.gifsFound.push(gif.media[0].gif.url);
                })
            });
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
