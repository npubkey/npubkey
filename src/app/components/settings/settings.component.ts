import { Component } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NostrService } from 'src/app/services/nostr.service';
import { signEvent, getEventHash, UnsignedEvent, Event } from 'nostr-tools';
import { User } from 'src/app/types/user';
import { webln } from "@getalby/sdk";


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {

    relay: string;
    zap: string;
    blurChecked: any;
    debugProfileEvent: any;
    debugFollowingList: any;
    showDebugUI: boolean = false;

    constructor(
        private signerService: SignerService,
        private router: Router,
        private snackBar: MatSnackBar,
        private nostrService: NostrService
    ) {
        this.relay = this.signerService.getRelay();
        this.zap = this.signerService.getDefaultZap();
        let pubkey = this.signerService.getPublicKey()
        this.blurChecked = this.signerService.getBlurImagesIfNotFollowing();
        if (pubkey === "") {
            this.router.navigate(["/login"])
        }
    }

    async saveRelay() {
        this.openSnackBar("Publishing profile and following list..", "dismiss");
        let kind0 = await this.nostrService.getUser(this.signerService.getPublicKey());
        if (kind0) {
            await this.publishSelfToNewRelay(kind0);
            await this.publishFollowingList(kind0);
            this.setRelay()
        } else {
            this.setRelay();
        }
    }

    async showDebug() {
        this.showDebugUI = !this.showDebugUI;
        // show profile event and following list event on current relay
        const pubkey = this.signerService.getPublicKey();
        this.debugProfileEvent = await this.nostrService.getUser(pubkey);
        this.debugFollowingList = await this.nostrService.getFollowing(pubkey);
    }

    setBlurImages() {
        this.signerService.setBlurImagesIfNotFollowing(this.blurChecked);
    }

    setRelay() {
        this.signerService.setRelay(this.relay);
        this.openSnackBar("Relay Set!", "dismiss");
    }

    setZap() {
        this.signerService.setDefaultZap(this.zap);
        this.openSnackBar("Default Zap Set", "dismiss");
    }

    async nostrWalletConnect() {
        const nwc = webln.NostrWebLNProvider.withNewSecret();
        try {
            await nwc.initNWC({name: 'npubkey'});
        } catch(e) {
            console.warn("Prompt closed");
            this.openSnackBar("Failed to connect alby", "dismiss");
        }
        const url = nwc.getNostrWalletConnectUrl(true);
        this.signerService.setNostrWalletConnectURI(url);
        this.openSnackBar("Get Alby Wallet Connected!", "dismiss");
    }

    async publishSelfToNewRelay(kind0: User) {
        // if we are changing relays -- publish our profile there
        if (kind0) {
            let x = {
                name: kind0.name,
                username: kind0.username,
                displayName: kind0.displayName,
                website: kind0.website,
                about: kind0.about,
                picture: kind0.picture,
                banner: kind0.banner,
                lud06: kind0.lud06,
                lud16: kind0.lud16,
                nip05: kind0.nip05
            }
            const content = JSON.stringify(x)
            const privateKey = this.signerService.getPrivateKey();
            let unsignedEvent = this.getUnsignedEvent(0, [], content);
            let signedEvent: Event;
            if (privateKey !== "") {
                let eventId = getEventHash(unsignedEvent)
                signedEvent = this.getSignedEvent(eventId, privateKey, unsignedEvent);
            } else {
                signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
            }
            this.nostrService.sendEvent(signedEvent);
        }
    }

    async publishFollowingList(user: User) {
        let tags: string[][] = this.signerService.getFollowingListAsTags()
        tags.push(["p", user.pubkey, "wss://relay.damus.io/", user.username]);
        let unsignedEvent = this.nostrService.getUnsignedEvent(3, tags, "");
        let signedEvent: Event;
        const privateKey = this.signerService.getPrivateKey();
        if (privateKey !== "") {
            let eventId = getEventHash(unsignedEvent)
            signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
        } else {
            signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
        }
        this.nostrService.sendEvent(signedEvent);
    }


    getUnsignedEvent(kind: number, tags: any, content: string) {
        const eventUnsigned: UnsignedEvent = {
            kind: kind,
            pubkey: this.signerService.getPublicKey(),
            tags: tags,
            content: content,
            created_at: Math.floor(Date.now() / 1000),
        }
        return eventUnsigned
    }

    getSignedEvent(eventId: string, privateKey: string, eventUnsigned: UnsignedEvent) {
        let signature = signEvent(eventUnsigned, privateKey);
        const signedEvent: Event = {
            id: eventId,
            kind: eventUnsigned.kind,
            pubkey: eventUnsigned.pubkey,
            tags: eventUnsigned.tags,
            content: eventUnsigned.content,
            created_at: eventUnsigned.created_at,
            sig: signature,
          };
          return signedEvent;
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
