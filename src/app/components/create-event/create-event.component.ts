import { Component } from '@angular/core';
import { Event, getEventHash, Filter } from "nostr-tools";
import { MatSnackBar } from '@angular/material/snack-bar';
import { NostrService } from '../../services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { User } from 'src/app/types/user';
import { GifService } from 'src/app/services/gif.service';
import { TenorGifResponse, TenorGif } from 'src/app/types/gif';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent {

    user: User | undefined | null = undefined;
    content: string = "";
    gifSearch: string = "";
    gifsFound: string[] = [];

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private snackBar: MatSnackBar,
        private gifService: GifService
    ) {
        this.getUser();
    }


    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

    addGifToPostContent(g: string) {
        this.content = this.content + " " + g;
        this.openSnackBar("GIF added!", "dismiss");
    }

    async searchGif() {
        this.gifsFound = [];
        if (this.user) {
            const wow = await this.gifService.getTopGifs(this.gifSearch, this.user.apiKey)
            wow.subscribe(response => {
                const results = response.results;
                results.forEach(gif => {
                    this.gifsFound.push(gif.media[0].gif.url);
                })
            });
        }
    }

    async getUser() {
        let pubkey = this.signerService.getPublicKey()
        this.user = await this.nostrService.getUser(pubkey);
    }

    async sendEvent() {
        const privateKey = this.signerService.getPrivateKey();
        let finalContent: string = `${this.content}`;
        let unsignedEvent = this.nostrService.getUnsignedEvent(1, [], finalContent);
        let signedEvent: Event;
        if (privateKey !== "") {
            let eventId = getEventHash(unsignedEvent)
            signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
        } else {
            signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
        }
        this.nostrService.sendEvent(signedEvent);
        this.openSnackBar("Message Sent!", "dismiss")
        this.content = "";
        this.gifsFound = [];
    }
}
