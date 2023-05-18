import { Component } from '@angular/core';
import { Event, getEventHash } from "nostr-tools";
import { MatSnackBar } from '@angular/material/snack-bar';
import { NostrService } from '../../services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { User } from 'src/app/types/user';
import { GifService } from 'src/app/services/gif.service';
import { ImageServiceService } from 'src/app/services/image-service.service';

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
    selectedFiles?: FileList;
    selectedFileNames: string[] = [];
    showProgressBar: boolean = false;
    preview: string = "";

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private snackBar: MatSnackBar,
        private gifService: GifService,
        private imageService: ImageServiceService
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

    addImageToPostContent(imgUrl: string) {
        this.content = this.content + " " + imgUrl;
        this.openSnackBar("Image added!", "dismiss");
    }

    selectFiles(event: any): void {
        this.selectedFileNames = [];
        this.selectedFiles = event.target.files;
        if (this.selectedFiles && this.selectedFiles[0]) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                console.log(e.target.result);
                this.preview = e.target.result;
            };
            reader.readAsDataURL(this.selectedFiles[0]);
            this.selectedFileNames.push(this.selectedFiles[0].name);
        }
    }

    upload(file: File): void {
        if (file) {
          this.imageService.uploadImage(file)
            .subscribe(response => this.addImageToPostContent(response));
        }
    }

    uploadImage(): void {
        if (this.selectedFiles) {
            this.upload(this.selectedFiles[0]);
        }
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
