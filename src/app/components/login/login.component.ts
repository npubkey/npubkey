import { Component } from '@angular/core';
import {generatePrivateKey, getPublicKey, nip19} from 'nostr-tools'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
    buttonText = "Generate New Key";
    privateKey: string = "";
    publicKey: string = "";
    npub: string = "";
    nsec: string = "";

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
