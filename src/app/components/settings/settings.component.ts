import { Component } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {

    constructor(
        private signerService: SignerService,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        let pubkey = this.signerService.getPublicKey()
        console.log(pubkey)
        if (pubkey === "") {
            this.router.navigate(["/login"])
        }
    }

    signOut() {
        this.signerService.clearKeys();
        this.openSnackBar("Successfully signed out", "dismiss");
        this.router.navigate(["/login"]);
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }


}
