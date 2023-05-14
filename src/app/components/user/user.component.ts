import { Component, Input, OnInit } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { User } from '../../types/user';
import {Clipboard} from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LightningService } from 'src/app/services/lightning.service';
import { LightningResponse, LightningInvoice } from 'src/app/types/post';
import { bech32 } from '@scure/base'


@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

    @Input() user?: User;
    canEdit: boolean = false;
    nsec: string = "";
    displaynsec: boolean = false;
    nsecButton: string = "key";
    isMyProfile: boolean = false;
    showZapForm: boolean = false;
    lightningResponse: LightningResponse | null = null;
    lightningInvoice: LightningInvoice | null = null;
    sats: string = "5";
    paymentInvoice: string = "";
    displayQRCode: boolean = false;
    showInvoiceSection: boolean = false;
    displayUserQR: boolean = false;
    userQRLink: string = "";

    constructor(
        private signerService: SignerService,
        private clipboard: Clipboard,
        private snackBar: MatSnackBar,
        private lightning: LightningService
    ) {}

    ngOnInit() {
        let pubkey = this.signerService.getPublicKey()
        if (this.user) {
            if (pubkey === this.user.pubkey) {
                this.canEdit = true;
                this.isMyProfile = true;
            }
            this.nsec = this.signerService.nsec();
            this.userQRLink = `https://npubkey.github.io/#/users/${this.user.npub}`;
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
                this.openSnackBar("user can't recieve zaps", "dismiss");
            }
        }
    }

    sendZap() {
        this.getLightningInvoice(String(Number(5)*1000));
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

    async getLightningInvoice(amount: string) {
        if (this.lightningResponse && this.lightningResponse.callback) {
            this.lightning.getLightningInvoice(this.lightningResponse.callback, amount)
            .subscribe(response => {
                console.log(response);
                this.lightningInvoice = response;
                this.paymentInvoice = this.lightningInvoice.pr;
                this.showZapForm = false;
                this.showInvoiceSection = true;
                this.payInvoice();
            });
        }
    }

    async payInvoice() {
        let paid = false;
        paid = await this.lightning.payInvoice(this.paymentInvoice);
        if (paid) {
            this.openSnackBar("Zapped!", "dismiss");
            this.hideInvoice();
        }
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
