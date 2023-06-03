import { Injectable } from '@angular/core';
import { UnsignedEvent, nip19, getPublicKey, nip04, Event } from 'nostr-tools';
import { NostrWindow } from '../types/nostr';

declare global {
    interface Window {
        nostr: NostrWindow | undefined
    }
}

@Injectable({
  providedIn: 'root'
})
export class SignerService {

    localStoragePrivateKeyName: string = "privateKey";
    localStoragePublicKeyName: string = "publicKey";

    constructor() { }

    clearKeys() {
        localStorage.removeItem("muteList");
        localStorage.removeItem("currentChip");
        localStorage.removeItem("following");
        localStorage.removeItem(`${this.getPublicKey()}_img`);
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

    nsec() {
        if (this.usingPrivateKey()) {
            let privateKey = this.getPrivateKey();
            return nip19.nsecEncode(privateKey);
        }
        return "";
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

    getLoggedInUserImage() {
        // gets from local storage if we have it
        return localStorage.getItem(`${this.getPublicKey()}_img`) || "";
    }

    setLoggedInUserImage(url: string) {
        // gets from local storage if we have it
        return localStorage.setItem(`${this.getPublicKey()}_img`, url);
    }

    usingPrivateKey() {
        if (localStorage.getItem(this.localStoragePrivateKeyName)) {
            return true;
        }
        return false;
    }

    getFollowingList() {
        const followingRaw = localStorage.getItem("following");
        if (followingRaw === null || followingRaw === "") {
            return [];
        }
        const following = (followingRaw).split(',');
        return following;
    }

    getMuteList() {
        return (localStorage.getItem("muteList") || "").split(',');
    }

    setMuteListFromTags(tags: string[][]): void {
        let muteList: string[] = []
        tags.forEach(t => {
            muteList.push(t[1]);
        })
        this.setMuteList(muteList);
    }

    setMuteList(muteList: string[]) {
        if (muteList.length === 0) {
            localStorage.setItem("muteList", "");
        } else {
            let muteSet = Array.from(new Set(muteList));
            localStorage.setItem("muteList", muteSet.filter(s => s).join(','));
        }
    }

    getRelay() {
        return localStorage.getItem("relay") || "wss://relay.damus.io/";
    }

    setRelay(relay: string) {
        localStorage.setItem("relay", relay);
    }

    getDefaultZap() {
        return localStorage.getItem("defaultZap") || "5";
    }

    setDefaultZap(defaultZap: string) {
        localStorage.setItem("defaultZap", defaultZap)
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
        let followingSet = Array.from(new Set(following));
        let newFollowingList = followingSet.filter(s => s).join(',')
        localStorage.setItem("following", newFollowingList);
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
        try {
            let privateKey = nip19.decode(nsec).data.toString();
            let pubkey = getPublicKey(privateKey);
            this.savePrivateKeyToSession(privateKey);
            this.savePublicKeyToSession(pubkey);
            return true;
        } catch (e) {
            return false;
        }
    }

    usingNostrBrowserExtension() {
        if (this.usingPrivateKey()) {
            return false;
        }
        if (window.nostr) {
            return true;
        }
        return false;
    }

    async handleLoginWithExtension(): Promise<boolean> {
        if (window.nostr) {
            const pubkey = await window.nostr.getPublicKey().catch(() => {
                return "";
            });
            if (pubkey === "") {
                return false;
            }
            this.setPublicKeyFromExtension(pubkey);
            return true;
        }
        return false;
    }

    async signEventWithExtension(unsignedEvent: UnsignedEvent): Promise<Event> {
        if (window.nostr) {
            const signedEvent = await window.nostr.signEvent(unsignedEvent)
            return signedEvent;
        } else {
            throw new Error("Tried to sign event with extension but failed");
        }
    }

    async signDMWithExtension(pubkey: string, content: string): Promise<string> {
        if (window.nostr && window.nostr.nip04?.encrypt) {
            return await window.nostr.nip04.encrypt(pubkey, content)
        }
        throw new Error("Failed to Sign with extension");
    }

    async decryptDMWithExtension(pubkey: string, ciphertext: string): Promise<string> {
        if (window.nostr && window.nostr.nip04?.decrypt) {
            const decryptedContent = await window.nostr.nip04.decrypt(pubkey, ciphertext)
                .catch((error: any) => {
                    return "*Failed to Decrypted Content*"
                });
            return decryptedContent;
        }
        return "Attempted Nostr Window decryption and failed."
    }

    async decryptWithPrivateKey(pubkey: string, ciphertext: string): Promise<string> {
        let privateKey = this.getPrivateKey()
        return await nip04.decrypt(privateKey, pubkey, ciphertext).catch((error) => {
            return "*Failed to Decrypted Content*";
        });
    }
}
