import { Component, Input, OnInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { Post, LightningResponse, LightningInvoice, Zap } from '../../types/post';
import { NostrService } from 'src/app/services/nostr.service';
import { getEventHash, Event } from 'nostr-tools';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { User } from 'src/app/types/user';
import { bech32 } from '@scure/base'
import { LightningService } from 'src/app/services/lightning.service';

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
    viewingRoot: boolean = false;
    rootEvent: string = "";
    replyContent: string = "";
    showReplyForm: boolean = false;
    showZapForm: boolean = false;
    user: User | null = null;
    lightningResponse: LightningResponse | null = null;
    lightningInvoice: LightningInvoice | null = null;
    sats: string = "5";
    paymentInvoice: string = "";
    displayQRCode: boolean = false;
    showInvoiceSection: boolean = false;

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService,
        private clipboard: Clipboard,
        private snackBar: MatSnackBar,
        private router: Router,
        private lightning: LightningService
    ) {}

    ngOnInit() {
        if (this.root?.noteId === this.post?.nip10Result?.root?.id) {
            this.viewingRoot = true;
        }
        if (this.post) {
            this.rootEvent = this.post.nip10Result?.root?.id || "";
        }
    }

    showEventJson() {
        console.log(this.post);
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
        this.getLightningInvoice(String(Number(this.sats)*1000));
    }

    async getLightningInvoice(amount: string) {
        if (this.lightningResponse && this.lightningResponse.callback) {
            this.lightning.getLightningInvoice(this.lightningResponse.callback, amount)
            .subscribe(response => {
                this.lightningInvoice = response;
                this.paymentInvoice = this.lightningInvoice.pr;
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
            tags.push(["p", this.post.pubkey])
            let rootAuthorTag = "#[0]";
            let otherOtherTags = "";
            for (let p in this.post.nip10Result.profiles) {
                let pk = this.post.nip10Result.profiles[p].pubkey;
                tags.push(["p", pk])
                otherOtherTags = otherOtherTags + ` #[${p+1}]`;
            }
            this.replyContent = `${rootAuthorTag} ${otherOtherTags} ${this.replyContent}`;
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
