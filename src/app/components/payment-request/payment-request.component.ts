import { Component, Inject, AfterViewInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { WalletComponent } from '../wallet/wallet.component';
import { decode } from "@gandlaf21/bolt11-decode";
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { webln } from "@getalby/sdk";
import { SignerService } from 'src/app/services/signer.service';

@Component({
  selector: 'app-payment-request',
  templateUrl: './payment-request.component.html',
  styleUrls: ['./payment-request.component.css']
})
export class PaymentRequestComponent implements AfterViewInit {

    paymentRequest: string;
    amount: number;
    username: string;
    loopCounter: number;
    intervalId: any;
    invoicePaid: boolean = false;

    constructor(
        private signerService: SignerService,
        private clipboard: Clipboard,
        private snackBar: MatSnackBar,
        private _bottomSheetRef: MatBottomSheetRef<WalletComponent>,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: JSON,
    ) {
        this.paymentRequest = this.data['paymentRequest'];
        this.username = this.data['username'];
        this.getBolt11Amount();
    }

    ngAfterViewInit(): void {
        this.checkPaymentComplete();
    }

    async checkPaymentComplete(): Promise<void> {
        this.loopCounter = 0;
        const nwcURI = this.signerService.getNostrWalletConnectURI()
        const nwc = new webln.NWC({ nostrWalletConnectUrl: nwcURI });
        const paymentRequest = this.paymentRequest;
        await nwc.enable();
        let counter = 0;
        // checks for payment every 7 seconds -- for 15 tries.
        const intervalId = setInterval(async () => {
            counter++;
            if (counter >= 15) {
                clearInterval(intervalId);
            }
            const response = await nwc.lookupInvoice({
                invoice: paymentRequest
            });
            if (response.paid === true) {
                clearInterval(intervalId);
                console.log("PAID");
                this.setInvoicePaid();
            }
        }, 7000);
    }

    setInvoicePaid() {
        this.invoicePaid = true;
    }

    exitBottomSheet() {
        this._bottomSheetRef.dismiss();
    }

    getBolt11Amount() {
        if (this.paymentRequest) {
            const decodedInvoice = decode(this.paymentRequest);
            for (let s of decodedInvoice.sections) {
                if (s.name === "amount") {
                    this.amount = Number(s.value)/1000;
                }
            }
        }
    }

    copyInvoice() {
        this.clipboard.copy(this.paymentRequest);
        this.openSnackBar("Invoice copied!", "dismiss");
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

}
