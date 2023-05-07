import { Injectable } from '@angular/core';
import { UnsignedEvent, nip19, getPublicKey, nip04 } from 'nostr-tools';

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

    getUsername(pubkey: string) {
        // can take a pubkey or npub
        if (pubkey.startsWith("npub")) {
            pubkey = nip19.decode(pubkey).data.toString()
        }
        return `@${(localStorage.getItem(`${pubkey}`) || nip19.npubEncode(pubkey))}`
    }

    npub() {
        let pubkey = this.getPublicKey();
        return nip19.npubEncode(pubkey);
    }

    pubkey(npub: string) {
        return nip19.decode(npub).data.toString();
    }

    encodeNoteAsEvent(note: string): string {
        let decodedNote = nip19.decode(note).data.toString()
        let eventP: nip19.EventPointer = {id: decodedNote}
        return nip19.neventEncode(eventP);
    }

    getPublicKey() {
        return localStorage.getItem(this.localStoragePublicKeyName) || "";
    }

    getPrivateKey() {
        return localStorage.getItem(this.localStoragePrivateKeyName) || "";
    }

    getFollowingList() {
        let following = (localStorage.getItem("following") || "").split(',');
        return following;
    }

    getFollowingListAsTags(): string[][] {
        let following = this.getFollowingList();
        let tags: string[][] = [];
        following.forEach(f => {
            tags.push(["p", f, "wss://relay.damus.io/", localStorage.getItem(`${f}`) || ""]);
        });
        return tags;
    }

    setFollowingListFromTags(tags: string[][]): void {
        let following: string[] = []
        tags.forEach(t => {
            following.push(t[1]);
        })
        this.setFollowingList(following);
    }

    setFollowingList(following: string[]) {
        localStorage.setItem("following", following.filter(s => s).join(',')); 
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

    handleLoginWithNsec(nsec: string) {
        let privateKey = nip19.decode(nsec).data.toString();
        let pubkey = getPublicKey(privateKey);
        this.savePrivateKeyToSession(privateKey);
        this.savePublicKeyToSession(pubkey);
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

    async signDMWithExtension(pubkey: string, content: string) {
        if (!(window as any).nostr) return;
        return (await (window as any).nostr.nip04.encrypt(pubkey, content))
    }

    async decryptDMWithExtension(pubkey: string, ciphertext: string): Promise<string> {
        if (!(window as any).nostr) return "";
        return (
            await (window as any).nostr.nip04.decrypt(pubkey, ciphertext)
            .catch(() => {
                return "*Failed to Decrypted Content*"
            })
        )
    }

    async decryptWithPrivateKey(pubkey: string, ciphertext: string): Promise<string> {
        let privateKey = this.getPrivateKey()
        return await nip04.decrypt(privateKey, pubkey, ciphertext).catch(() => {
            console.log("FUCK OYU");
            return "*Failed to Decrypt Content*";
        });
    }
}
