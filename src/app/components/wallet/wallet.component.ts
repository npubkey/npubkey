import { Component, OnInit } from '@angular/core';
import { webln } from "@getalby/sdk";
import { SignerService } from 'src/app/services/signer.service';


@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
    nwc: any;
    balance: number = 0;

    constructor(
        private signerService: SignerService
    ) {
        const nwcURI = this.signerService.getNostrWalletConnectURI()
        const nwc = new webln.NWC({ nostrWalletConnectUrl: nwcURI });
        nwc.enable();
        console.log(nwc.getInfo())
    }

    ngOnInit(): void {
        //this.getBalance();
    }

}
