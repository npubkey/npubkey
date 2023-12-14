import { Component } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { Event, getEventHash } from 'nostr-tools';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent {

    profileForm = this.fb.group({
        name: ['', Validators.required],
        username: ['', Validators.required],
        displayName: [''],
        website: [''],
        about: [''],
        picture: [''],
        banner: [''],
        lud06: [''],
        lud16: ['', Validators.pattern("^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,4}$")],
        nip05: ['', Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")],
    });
    content: string;

    constructor(
        private fb: FormBuilder,
        private signerService: SignerService,
        private nostrService: NostrService,
        private snackBar: MatSnackBar,
        private router: Router
    ) {
        // need to make sure we have pubkey
        if (this.signerService.usingNostrBrowserExtension()) {
            // TODO probably make this whole thing flow better 
            // ie if not logged in dont allow this page or something
            this.signerService.handleLoginWithExtension();
        }
        this.setValues();
    }

    onSubmit() {
        console.log(this.profileForm);
        this.submit();
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

    async setValues() {
        let kind0 = await this.nostrService.getUser(this.signerService.getPublicKey());
        if (kind0) {
            this.profileForm.setValue({
                name: kind0.name,
                username: kind0.username,
                displayName: kind0.displayName,
                website: kind0.website,
                about: kind0.about,
                picture: kind0.picture,
                banner: kind0.banner,
                lud06: kind0.lud06,
                lud16: kind0.lud16,
                nip05: kind0.nip05,
            });
        }
    }

    async submit() {
        let x = {
            name: this.profileForm.value.name,
            username: this.profileForm.value.username,
            displayName: this.profileForm.value.displayName,
            website: this.profileForm.value.website,
            about: this.profileForm.value.about,
            picture: this.profileForm.value.picture,
            banner: this.profileForm.value.banner,
            lud06: this.profileForm.value.lud06,
            lud16: this.profileForm.value.lud16,
            nip05: this.profileForm.value.nip05
        }
        this.content = JSON.stringify(x)
        const privateKey = this.signerService.getPrivateKey();
        let unsignedEvent = this.nostrService.getUnsignedEvent(0, [], this.content);
        let signedEvent: Event;
        if (privateKey !== "") {
            let eventId = getEventHash(unsignedEvent)
            signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
        } else {
            console.log('using extension');
            signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
        }
        this.nostrService.publishEventToPool(signedEvent);
        this.signerService.setLoggedInUserImage(x.picture);
        this.openSnackBar("Profile Updated!", "dismiss");
        this.router.navigate([`/users/${this.signerService.npub()}`])
    }
}
