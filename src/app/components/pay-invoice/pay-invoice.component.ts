import { Component, Inject, OnInit } from '@angular/core';
import { WalletComponent } from '../wallet/wallet.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { SignerService } from 'src/app/services/signer.service';
import { webln } from '@getalby/sdk';
import { decode } from '@gandlaf21/bolt11-decode';


@Component({
  selector: 'app-pay-invoice',
  templateUrl: './pay-invoice.component.html',
  styleUrls: ['./pay-invoice.component.css']
})
export class PayInvoiceComponent implements OnInit {
    loading: boolean = true;
    paymentInvoice: string = "";
    invoiceAmount: string = "?";
    showConfirmPayment: boolean = false;
    sending: boolean = false;
    error: string = "";

    constructor(
        private signerService: SignerService,
        private snackBar: MatSnackBar,
        private _bottomSheetRef: MatBottomSheetRef<WalletComponent>,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: JSON,
    ) {
        this.paymentInvoice = data['invoice'];
    }

    ngOnInit(): void {
        this.setInvoiceAmount(this.paymentInvoice);
    }

    async sendPayment() {
        this.sending = true;
        this.payInvoice();
    }

    async payInvoice() {
        let paid = false;
        const nwcURI = this.signerService.getNostrWalletConnectURI()
        paid = await this.zapWithNWC(nwcURI, this.paymentInvoice);
        if (paid) {
            this.openSnackBar("Zapped!", "dismiss");
            this.exitBottomSheet();
        } else {
            this.openSnackBar("Payment Failed", "dismiss");
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

    setInvoiceAmount(invoice: string) {
        if (invoice) {
            try {
                const decodedInvoice = decode(invoice);
                for (let s of decodedInvoice.sections) {
                    if (s.name === "amount") {
                        this.invoiceAmount = String(Number(s.value)/1000);
                        break;
                    }
                }
            } catch {
                this.error = "Invalid Lightning Invoice";
            }
        }
    }

    exitBottomSheet() {
        this._bottomSheetRef.dismiss();
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }
}
