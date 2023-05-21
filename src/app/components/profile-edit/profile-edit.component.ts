import { Component, OnInit } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { 
    Event,
    UnsignedEvent,
    getEventHash,
    signEvent,
 } from 'nostr-tools';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {

    // Form Fields
    name: string = "";
    username: string = "";
    displayName: string = "";
    website: string = "";
    about: string = "";
    picture: string = "";
    banner: string = "";
    lud06: string = ""; // lnurl
    lud16: string = ""; // lightning address
    nip05: string = "";
    content: string = "";

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit() {
        // need to make sure we have pubkey
        if (this.signerService.usingNostrBrowserExtension()) {
            // TODO probably make this whole thing flow better 
            // ie if not logged in dont allow this page or something
            this.signerService.handleLoginWithExtension();
        }
        this.setValues();
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

    async setValues() {
        let kind0 = await this.nostrService.getUser(this.signerService.getPublicKey());
        if (kind0) {
            this.name = kind0.name
            this.username = kind0.username
            this.displayName = kind0.displayName
            this.website = kind0.website
            this.about = kind0.about
            this.picture = kind0.picture
            this.banner = kind0.banner
            this.lud06 = kind0.lud06
            this.lud16 = kind0.lud16
            this.nip05 = kind0.nip05
        }
    }

    async submit() {
        let x = {
            name: this.name,
            username: this.username,
            displayName: this.displayName,
            website: this.website,
            about: this.about,
            picture: this.picture,
            banner: this.banner,
            lud06: this.lud06,
            lud16: this.lud16,
            nip05: this.nip05
        }
        this.content = JSON.stringify(x)
        const privateKey = this.signerService.getPrivateKey();
        let unsignedEvent = this.getUnsignedEvent(0, []);
        let signedEvent: Event;
        if (privateKey !== "") {
            let eventId = getEventHash(unsignedEvent)
            signedEvent = this.getSignedEvent(eventId, privateKey, unsignedEvent);
        } else {
            console.log('using extension');
            signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
        }
        this.nostrService.sendEvent(signedEvent);
        this.openSnackBar("Profile Updated!", "dismiss");
    }

    getUnsignedEvent(kind: number, tags: any) {
        const eventUnsigned: UnsignedEvent = {
            kind: kind,
            pubkey: this.signerService.getPublicKey(),
            tags: tags,
            content: this.content,
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
}
