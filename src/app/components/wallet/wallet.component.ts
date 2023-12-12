import { Component, OnInit } from '@angular/core';
import { webln } from "@getalby/sdk";
import { SignerService } from 'src/app/services/signer.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { PaymentRequestComponent } from '../payment-request/payment-request.component';
import { SendPaymentComponent } from '../send-payment/send-payment.component';
import { BarcodeFormat } from '@zxing/library';
import { PayInvoiceComponent } from '../pay-invoice/pay-invoice.component';

interface Balance {
    balance: number;
    currency: string;
}

interface PaymentRequest {
    paymentRequest: string;
}

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
    nwc: any;
    balance: Balance;
    loading: boolean = true;
    currentInput: string = "";
    paymentRequest: PaymentRequest;
    username: string;
    allowedFormats = [ BarcodeFormat.QR_CODE ]
    scanQR: boolean = false;
    qrResultString: string = "";
    qrCodeScannerButton: string = "qr_code_scanner";

    constructor(
        private signerService: SignerService,
        private _bottomSheet: MatBottomSheet
    ) {
        const nwcURI = this.signerService.getNostrWalletConnectURI()
        this.nwc = new webln.NWC({ nostrWalletConnectUrl: nwcURI });
    }

    ngOnInit(): void {
        this.username = this.signerService.getUsername(this.signerService.getPublicKey());
        this.setBalance();
    }

    async setBalance(): Promise<void> {
        await this.nwc.enable();
        this.balance = await this.nwc.getBalance();
        this.loading = false;
    }

    changeNumber(value: string) {
        if (value === 'backspace') {
            this.currentInput = this.currentInput.slice(0, -1);
        } else if (this.currentInput.length > 11) {
            return;
        } else if (value === '.' && this.currentInput.includes('.')) {
            return;
        } else {
            this.currentInput = this.currentInput.concat(value);
        }
    }

    async receive(): Promise<void> {
        // this._bottomSheet.open();
        const ok = await this.nwc.makeInvoice({
            amount: Number(this.currentInput), // in sats
            defaultMemo: "npubkey lightning request",
        });
        console.log(ok);
        this.paymentRequest = ok
        console.log(this.paymentRequest.paymentRequest);
        this._bottomSheet.open(PaymentRequestComponent, {
            data: {
                paymentRequest: this.paymentRequest.paymentRequest,
                username: this.username
            }
        });
    }

    send(){
        this._bottomSheet.open(SendPaymentComponent, {
            data: {
                sats: Number(this.currentInput)
            }
        });
    }

    openQRScanner() {
        if (this.scanQR) {
            this.scanQR = false;
            this.qrCodeScannerButton = "qr_code_scanner";
        } else {
            this.scanQR = true;
            this.qrCodeScannerButton = "close";
        }
    }

    // scanSuccessHandler(event) {
    //     console.log(event);
    // }

    async pasteInvoice() {
        const text = await navigator.clipboard.readText();
        this.qrResultString = text;
        if (this.isValidPaymentInvoice(this.qrResultString)) {
            this._bottomSheet.open(PayInvoiceComponent, {
                data: {
                    invoice: this.qrResultString
                }
            });
        } else {
            console.log("INVALID");
        }
    }

    scanSuccessHandler(resultString: string) {
        this.qrResultString = resultString;
        if (this.isValidPaymentInvoice(this.qrResultString)) {
            this._bottomSheet.open(PayInvoiceComponent, {
                data: {
                    invoice: this.qrResultString
                }
            });
        } else {
            console.log("INVALID");
        }
    }

    isValidPaymentInvoice(value: string) {
        return true;
    }

    // scanErrorHandler($event) {
    //     console.log($event);
    // }
    
    // scanFailureHandler($event) {
    //     console.log($event);
    // }
}
