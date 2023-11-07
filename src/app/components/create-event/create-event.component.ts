import { Component } from '@angular/core';
import { Event, getEventHash } from "nostr-tools";
import { MatSnackBar } from '@angular/material/snack-bar';
import { NostrService } from '../../services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { User } from 'src/app/types/user';
import { GifService } from 'src/app/services/gif.service';
import { ImageServiceService } from 'src/app/services/image-service.service';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent {

    user: User | undefined | null = undefined;
    showGifSearch: boolean = false;
    content: string = "";
    gifSearch: string = "";
    gifsFound: string[] = [];
    selectedFiles?: FileList;
    selectedFileNames: string[] = [];
    showProgressBar: boolean = false;
    previews: Array<string> = [];

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private snackBar: MatSnackBar,
        private gifService: GifService,
        private imageService: ImageServiceService,
        private _bottomSheetRef: MatBottomSheetRef<HeaderComponent>
    ) {
        this.getUser();
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

    addGifToPostContent(g: string) {
        this.previews.push(g);
        this.openSnackBar("GIF added!", "dismiss");
        this.closeGifSearch();
    }

    addImageToPostContent(imgUrl: string) {
        this.previews.push(imgUrl);
        this.openSnackBar("Image added!", "dismiss");
    }

    selectFiles(event: any): void {
        this.selectedFileNames = [];
        this.selectedFiles = event.target.files;
        if (this.selectedFiles && this.selectedFiles[0]) {
            const reader = new FileReader();
            // reader.onload = (e: any) => {
                
            // };
            reader.readAsDataURL(this.selectedFiles[0]);
            this.selectedFileNames.push(this.selectedFiles[0].name);
            this.uploadImage();
        }
    }

    upload(file: File): void {
        if (file) {
          this.imageService.uploadImage(file)
            .subscribe(response => {
                console.log(response)
                this.addImageToPostContent(response['imageUrl'])
            });
        }
    }

    uploadImage(): void {
        if (this.selectedFiles) {
            this.upload(this.selectedFiles[0]);
        }
    }

    openGifSearch() {
        this.showGifSearch = true;
    }

    closeGifSearch() {
        this.gifSearch = "";
        this.showGifSearch = false;
    }

    exitBottomSheet() {
        this._bottomSheetRef.dismiss();
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
        let finalContent: string = `${this.content} ${this.previews.join(' ')}`;
        console.log("WOW")
        console.log(finalContent);
        if (!/\S/.test(finalContent)) {
            this.openSnackBar("Message Empty", "dismiss");
        } else {
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
            this.previews = [];
            this.exitBottomSheet();
        }
    }
}
