import { Component } from '@angular/core';
import {generatePrivateKey, getPublicKey, nip19} from 'nostr-tools'

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
    localStoragePrivateKeyName: string = "privateKey";
    localStoragePublicKeyName: string = "publicKey";

    saveKeyToSession() {
        localStorage.setItem(this.localStoragePrivateKeyName, this.privateKey);
        localStorage.setItem(this.localStoragePublicKeyName, this.publicKey);
    }

    setKeys() {
        this.setPrivateKey();
        this.setPublicKey();
        this.setNpub()
        this.setNpriv();
        this.saveKeyToSession();
    }

    setPrivateKey() {
        this.privateKey = generatePrivateKey() // `sk` is a hex string
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
