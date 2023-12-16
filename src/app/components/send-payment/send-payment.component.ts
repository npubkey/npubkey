import { AfterViewInit, Component, Inject } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { WalletComponent } from '../wallet/wallet.component';
import { NostrService } from 'src/app/services/nostr.service';
import { User, DBUser, dbUserToUser } from 'src/app/types/user';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Filter } from 'nostr-tools';
import { webln } from "@getalby/sdk";
import { bech32 } from '@scure/base'
import { LightningService } from 'src/app/services/lightning.service';
import { LightningInvoice, LightningResponse } from 'src/app/types/post';
import { decode } from "@gandlaf21/bolt11-decode";

@Component({
  selector: 'app-send-payment',
  templateUrl: './send-payment.component.html',
  styleUrls: ['./send-payment.component.css']
})
export class SendPaymentComponent implements AfterViewInit {

    satsAmount: number;
    loading: boolean = true;
    contactSelected: boolean = false;
    contactList: string[] = [];
    users: User[] = [];
    displayedUsers: User[] = [];
    filterText: string = "";
    user: User;
    lightningResponse: LightningResponse | null = null;
    lightningInvoice: LightningInvoice | null = null;
    paymentInvoice: string = "";
    invoiceAmount: string = "?";
    showConfirmPayment: boolean = false;
    sending: boolean = false;

    constructor(
        private signerService: SignerService,
        private dbService: NgxIndexedDBService,
        private nostrService: NostrService,
        private snackBar: MatSnackBar,
        private _bottomSheetRef: MatBottomSheetRef<WalletComponent>,
        private lightning: LightningService,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: JSON,
    ) {
        this.satsAmount = data['sats'] * 1000;
    }

    ngAfterViewInit(): void {
        this.getFollowingUsers();
    }

    openPaymentConfirm(user: User) {
        this.showConfirmPayment = true;
        this.user = user;
    }

    async sendPayment(user: User) {
        this.user = user;
        this.sending = true;
        await this.getLightningInfo();
    }

    async getLightningInvoice(amount: string) {
        console.log("GETTING INVOICE")
        console.log(amount);
        console.log(this.lightningResponse)
        if (this.lightningResponse && this.lightningResponse.callback) {
            this.lightning.getLightningInvoice(this.lightningResponse.callback, amount)
            .subscribe(response => {
                this.lightningInvoice = response;
                this.paymentInvoice = this.lightningInvoice.pr;
                this.setInvoiceAmount(this.paymentInvoice);
                this.payInvoice();
                this.exitBottomSheet();
            });
        }
    }

    async payInvoice() {
        let paid = false;
        const nwcURI = this.signerService.getNostrWalletConnectURI()
        paid = await this.zapWithNWC(nwcURI, this.paymentInvoice);
        if (paid) {
            this.openSnackBar("Zapped!", "dismiss");
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
            const decodedInvoice = decode(invoice);
            for (let s of decodedInvoice.sections) {
                if (s.name === "amount") {
                    this.invoiceAmount = String(Number(s.value)/1000);
                    break;
                }
            }
        }
    }

    async getLightningInfo() {
        console.log("getting lightning info")
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
        console.log('lightning address')
        console.log(lightningAddress)
        if (lightningAddress !== "") {
            this.lightning.getLightning(lightningAddress)
            .subscribe(async (response) => {
                console.log('paying')
                this.lightningResponse = response;
                if (this.lightningResponse.status && this.lightningResponse.status == "Failed") {
                    this.openSnackBar("Failed to lookup lightning address", "dismiss");
                } else if (!this.lightningResponse.callback) {
                    this.openSnackBar("couldn't find users lightning address", "dismiss");
                } else {
                    await this.getLightningInvoice(this.satsAmount.toString());
                }
            });
        } else {
            this.openSnackBar("No lightning address found", "dismiss");
        }
    }

    filterContacts() {
        if (this.filterText === "") {
            this.displayedUsers = this.users;
        }
        this.displayedUsers = [];
        this.users.forEach((user) => {
            console.log(user)
            if (user.displayName.toLowerCase().includes(this.filterText.toLowerCase()) ||
                user.npub.toLowerCase().includes(this.filterText.toLowerCase()) ||
                user.username.toLowerCase().includes(this.filterText.toLowerCase())) {
                this.displayedUsers.push(user);
            }
        })
    }

    getFollowingUsers() {
         this.getFollowingUsersFromDB();
         this.getFollowingUsersFromNostr();
    }

    getFollowingUsersFromDB() {
        this.dbService.getAll("users")
        .subscribe((results: DBUser[]) => {
            for(const u of results) {
                if (u === undefined) {
                    continue;
                }
                console.log(u)
                if (u.following) {
                    this.users.push(dbUserToUser(u));
                }
            }
            this.displayedUsers = this.users;
        });
    }

    async getFollowingUsersFromNostr() {
        let contactList: string[] = this.signerService.getFollowingList()
        let filter: Filter = {authors: contactList}
        this.users.push(...await this.nostrService.getKind0(filter));
        this.displayedUsers = this.users;
        this.loading = false;
    }

    exitBottomSheet() {
        this._bottomSheetRef.dismiss();
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }
}
