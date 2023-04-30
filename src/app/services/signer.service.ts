import { Injectable } from '@angular/core';
import { UnsignedEvent } from 'nostr-tools';

@Injectable({
  providedIn: 'root'
})
export class SignerService {

    localStoragePrivateKeyName: string = "privateKey";
    localStoragePublicKeyName: string = "publicKey";

    constructor() { }

    clearKeys() {
        localStorage.removeItem(this.localStoragePrivateKeyName);
        localStorage.removeItem(this.localStoragePublicKeyName);
    }

    getPublicKey() {
        return localStorage.getItem(this.localStoragePublicKeyName) || "";
    }

    getPrivateKey() {
        return localStorage.getItem(this.localStoragePrivateKeyName) || "";
    }

    savePublicKeyToSession(publicKey: string) {
        localStorage.setItem(this.localStoragePublicKeyName, publicKey);
    }

    savePrivateKeyToSession(privateKey: string) {
        localStorage.setItem(this.localStoragePrivateKeyName, privateKey);
    }

    setPublicKeyFromExtension(publicKey: string) {
        this.savePublicKeyToSession(publicKey);
    }

    async handleLoginWithExtension() {
        if (!(window as any).nostr) return;
        const pubKey = await (window as any).nostr.getPublicKey();
        this.setPublicKeyFromExtension(pubKey);
    }

    async signEventWithExtension(unsignedEvent: UnsignedEvent) {
        if (!(window as any).nostr) return;
        return (await (window as any).nostr.signEvent(unsignedEvent)) || {}
    }
}
