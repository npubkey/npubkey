import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {generatePrivateKey, getPublicKey, nip19} from 'nostr-tools'
import { SignerService } from 'src/app/services/signer.service';
@Component({
  selector: 'app-generate',
  templateUrl: './generate.component.html',
  styleUrls: ['./generate.component.css']
})
export class GenerateComponent {
    buttonText = "Generate New Key";
    privateKey: string = "";
    publicKey: string = "";
    npub: string = "";
    nsec: string = "";

    inputNsec: string = "";

    constructor(
        private signer: SignerService,
        private snackBar: MatSnackBar
        ) {
    }

    clearKeys() {
        this.signer.clearKeys();
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

    nsecLogin() {
        this.signer.handleLoginWithNsec(this.inputNsec);
        this.openSnackBar("You are Logged In!", "dismiss");
        this.inputNsec = "";
    }

    handleLoginWithExtension() {
        this.signer.handleLoginWithExtension()
    }

    saveKeyToSession() {
        this.signer.savePrivateKeyToSession(this.privateKey);
        this.signer.savePublicKeyToSession(this.publicKey);
    }

    setKeys() {
        this.setPrivateKey();
        this.setPublicKey();
        this.setNpub()
        this.setNpriv();
        this.saveKeyToSession();
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
