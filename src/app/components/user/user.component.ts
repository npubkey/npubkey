import { Component, Input, OnInit } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { User } from '../../types/user';
import {Clipboard} from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    nsecButton: string = "Show nsec";

    constructor(
        private signerService: SignerService,
        private clipboard: Clipboard,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit() {
        let pubkey = this.signerService.getPublicKey()
        if (this.user) {
            if (pubkey === this.user.pubkey) {
                this.canEdit = true;
            }
            this.nsec = this.signerService.nsec();
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
            this.nsecButton = "Show nsec";
        } else {
            this.displaynsec = true;
            this.nsecButton = "Hide nsec";
        }
    }
}
