import { Component } from '@angular/core';
import { generatePrivateKey, getPublicKey, nip19 } from 'nostr-tools'
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SignerService } from 'src/app/services/signer.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
    buttonText = "Generate New Key";
    privateKey: string = "";
    publicKey: string = "";
    npub: string = "";
    nsec: string = "";
    generateNewKeyView: boolean = false;
    loginWithPrivateKeyView: boolean = false;
    loginWithExtensionView: boolean = false;
    initialLoginView: boolean = true;

    constructor(
        private clipboard: Clipboard,
        private snackBar: MatSnackBar,
        private router: Router,
        private signerService: SignerService
    ) {
        // check if user already logged in
        if (this.signerService.getPublicKey() !== "") {
            this.openSnackBar("You are already signed in!", "dismiss");
            this.router.navigate(["/profile"]);
        }
    }

    generateNewKey() {
        this.generateNewKeyView = true;
        this.loginWithPrivateKeyView = false;
        this.loginWithExtensionView = false;
        this.initialLoginView = false;
        this.setKeys();
    }

    loginWithPrivateKey() {
        this.npub = "";
        this.nsec = "";
        this.generateNewKeyView = false;
        this.loginWithPrivateKeyView = true;
        this.loginWithExtensionView = false;
        this.initialLoginView = false;
    }

    loginWithExtension() {
        this.npub = "";
        this.nsec = ""; // put this in a clear keys function
        this.generateNewKeyView = false;
        this.loginWithPrivateKeyView = false;
        this.loginWithExtensionView = true;
        this.initialLoginView = false;
    }

    home() {
        this.generateNewKeyView = false;
        this.loginWithPrivateKeyView = false;
        this.loginWithExtensionView = false;
        this.initialLoginView = true;
    }

    goToApp() {
        if (this.generateNewKeyView || this.loginWithPrivateKeyView) {
            this.signerService.handleLoginWithNsec(this.nsec);
        } else {
            this.signerService.handleLoginWithExtension();
        }
        this.openSnackBar("Succesfully Signed In", "dismiss");
        this.router.navigate(['/profile']);
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

    copynsec(){
        this.clipboard.copy(this.nsec);
        this.openSnackBar("nsec copied!", "dismiss");
    }

    copynpub(){
        this.clipboard.copy(this.npub);
        this.openSnackBar("npub copied!", "dismiss");
    }

    setKeys() {
        this.setPrivateKey();
        this.setPublicKey();
        this.setNpub()
        this.setNpriv();
    }

    setPrivateKey() {
        this.privateKey = generatePrivateKey()
    }

    setPublicKey() {
        this.publicKey = getPublicKey(this.privateKey);
    }

    setNpub() {
        this.npub = nip19.npubEncode(this.publicKey);
    }

    setNpriv() {
        this.nsec = nip19.nsecEncode(this.privateKey);
    }
}
