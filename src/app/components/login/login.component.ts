import { Component } from '@angular/core';
import { generatePrivateKey, getPublicKey, nip19, getEventHash, Event } from 'nostr-tools'
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SignerService } from 'src/app/services/signer.service';
import { NostrService } from 'src/app/services/nostr.service';

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
        private signerService: SignerService,
        private nostrService: NostrService
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

    async goToApp() {
        this.signerService.clearKeys();
        let success: boolean = true;
        if (this.generateNewKeyView) {
            success = this.signerService.handleLoginWithNsec(this.nsec);
        } else if (this.loginWithPrivateKeyView && this.nsec !== "") {
            success = this.signerService.handleLoginWithNsec(this.nsec);
        } else {
            success = await this.handleLoginWithExtension();
        }
        if (success) {
            // this.sendFollownpubkey()
            this.openSnackBar("Succesfully Signed In", "dismiss");
            this.router.navigate(['/profile']);
        } else {
            this.openSnackBar("Failed Signed In", "dismiss");
            this.signerService.clearKeys();
            this.router.navigate(['/login']);
        }
    }

    async handleLoginWithExtension(): Promise<boolean> {
        if (this.signerService.usingNostrBrowserExtension()) {
            return this.signerService.handleLoginWithExtension()
        } else {
            this.openSnackBar("No Nostr Browser extension", "dismiss");
            return false;
        }
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
        this.signerService.clearKeys();
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

    // TODO fix this
    // async sendFollownpubkey() {
    //     await this.nostrService.getContactList(this.publicKey);
    //     const npubkey = nip19.decode("npub14yjwjjmatjtpttum3l58z3qsujakg384jypgjv6d7dq23xl5ydzslmzwmg").data.toString();
    //     let tags: string[][] = this.signerService.getFollowingListAsTags()
    //     tags.push(["p", npubkey, "wss://relay.damus.io/", "npubkey"]);
    //     this.signerService.setFollowingListFromTags(tags);
    //     let unsignedEvent = this.nostrService.getUnsignedEvent(3, tags, "");
    //     let signedEvent: Event;
    //     const privateKey = this.signerService.getPrivateKey();
    //     if (privateKey !== "") {
    //         let eventId = getEventHash(unsignedEvent)
    //         signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
    //     } else {
    //         signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
    //     }
    //     if (signedEvent) {
    //         this.nostrService.sendEvent(signedEvent);
    //     }
    // }
}
