import { Component, Inject, AfterViewInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { WalletComponent } from '../wallet/wallet.component';
import { decode } from "@gandlaf21/bolt11-decode";


@Component({
  selector: 'app-payment-request',
  templateUrl: './payment-request.component.html',
  styleUrls: ['./payment-request.component.css']
})
export class PaymentRequestComponent implements AfterViewInit {

    paymentRequest: string;
    amount: number;
    username: string;

    constructor(
        private _bottomSheetRef: MatBottomSheetRef<WalletComponent>,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: JSON,
    ) {
        this.paymentRequest = this.data['paymentRequest'];
        this.username = this.data['username'];
        this.getBolt11Amount();
    }

    ngAfterViewInit(): void {
        console.log(this.paymentRequest);
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
}
