import { Component, Input, OnInit } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { User } from '../../types/user';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LightningService } from 'src/app/services/lightning.service';
import { LightningResponse, LightningInvoice } from 'src/app/types/post';
import { bech32 } from '@scure/base'
import { decode } from "@gandlaf21/bolt11-decode";
import { MatDialog } from '@angular/material/dialog';
import { ImageDialogComponent } from '../image-dialog/image-dialog.component';
import { webln } from "@getalby/sdk";
import { NostrService } from 'src/app/services/nostr.service';


@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
    @Input() canEnlarge = false;
    @Input() user?: User;
    @Input() nip05Verified?: boolean;
    canEdit: boolean = false;
    nsec: string = "";
    displaynsec: boolean = false;
    nsecButton: string = "key";
    isMyProfile: boolean = false;
    showZapForm: boolean = false;
    lightningResponse: LightningResponse | null = null;
    lightningInvoice: LightningInvoice | null = null;
    sats: string;
    paymentInvoice: string = "";
    invoiceAmount: string = "?";
    displayQRCode: boolean = false;
    showInvoiceSection: boolean = false;
    displayUserQR: boolean = false;
    userQRLink: string = "";
    followList: string[];
    following: boolean;
    followerCount: number = 0;
    followingCount: number = 0;

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService,
        private clipboard: Clipboard,
        private snackBar: MatSnackBar,
        private lightning: LightningService,
        private dialog: MatDialog
    ) {
        this.followList = this.signerService.getFollowingList();
        this.sats = this.signerService.getDefaultZap();
    }

    ngOnInit() {
        let pubkey = this.signerService.getPublicKey()
        if (this.user) {
            if (this.followList.includes(this.user.pubkey)) {
                this.following = true;
            } else {
                this.following = false;
            }
            if (pubkey === this.user.pubkey) {
                this.canEdit = true;
                this.isMyProfile = true;
            }
            this.nsec = this.signerService.nsec();
            this.userQRLink = `https://npubkey.github.io/#/users/${this.user.npub}`;
            this.getFollowerCount();
            this.getFollowingCount();
        }
    }

    async zap() {
        if (this.showZapForm) {
            this.showZapForm = false;
        } else {
            this.showZapForm = true;
        }
        if (this.showZapForm) {
            if (this.user && (this.user.lud06 || this.user.lud16)) {
                this.getLightningInfo();
            } else {
                this.openSnackBar("user can't receive zaps", "dismiss");
            }
        }
    }

    async getFollowerCount() {
        this.followerCount = await this.nostrService.getFollowerCount(this.user.pubkey);
    }

    async getFollowingCount() {
        this.followingCount = await this.nostrService.getFollowerCount(this.user.pubkey);
    }

    sendZap() {
        this.getLightningInvoice(String(Number(this.sats)*1000));
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

    getLightningInfo() {
        let lightningAddress = "";
        if (this.user && this.user.lud06) {
            let {prefix, words} = bech32.decode(this.user.lud06, 5000)
            let data = new Uint8Array(bech32.fromWords(words))
            lightningAddress =  new TextDecoder().decode(Uint8Array.from(data));
        } else if (this.user && this.user.lud16 && this.user.lud16.toLowerCase().startsWith("lnurl")) {
            // handle case where ppl put lnurl in lud06
            let {prefix, words} = bech32.decode(this.user.lud16, 5000)
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
                    this.displayUserQR = false;
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

    copynsec() {
        if (this.user && this.displaynsec) {
            this.clipboard.copy(this.nsec);
            this.openSnackBar("nsec copied. keep it private!", "dismiss");
        }
    }

    copyLink() {
        if (this.user) {
            const url = `https://npubkey.github.io/#/users/${this.user.npub}`;
            this.clipboard.copy(url);
            this.openSnackBar("Link to profile copied", "dismiss");
        }
    }

    async setFollowingListAsYours() {
        if (this.user) {
            let contactList = await this.nostrService.getContactListEvent(this.user.pubkey);
            this.signerService.setFollowingListFromTags(contactList.tags);
        }
    }

    enlargeUserPicture() {
        if (this.canEnlarge) {
            this.dialog.open(ImageDialogComponent, {data: {picture: this.user.picture}});
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
                this.payInvoice();
            });
        }
    }

    async payInvoice() {
        let paid = false;
        const nwcURI = this.signerService.getNostrWalletConnectURI()
        console.log(nwcURI);
        if (nwcURI === null) {
            paid = await this.lightning.payInvoice(this.paymentInvoice);
        } else {
            paid = await this.zapWithNWC(nwcURI, this.paymentInvoice);
        }
        if (paid) {
            this.openSnackBar("Zapped!", "dismiss");
            this.hideInvoice();
        }
    }

    async zapWithNWC(nwcURI: string, invoice: string): Promise<boolean> {
        this.openSnackBar("Zapping with Nostr Wallet Connect..", "dismiss");
        const nwc = new webln.NWC({ nostrWalletConnectUrl: nwcURI });
        // connect to the relay
        await nwc.enable();
        
        // now you can send payments by passing in the invoice
        const response = await nwc.sendPayment(invoice);
        console.log(response);
        // disconnect from the relay
        nwc.close()
        return true;
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

    copynpub() {
        if (this.user) {
            this.clipboard.copy(this.user.npub);
            this.openSnackBar("npub copied!", "dismiss");
        }
    }

    showNsec() {
        if (this.displaynsec) {
            this.displaynsec = false;
            this.nsecButton = "key";
        } else {
            this.displaynsec = true;
            this.nsecButton = "key_off";
        }
    }

    showUserQR() {
        if (this.displayUserQR) {
            this.displayUserQR = false;
        } else {
            this.displayUserQR = true;
            this.showZapForm = false;
        }
    }
}
