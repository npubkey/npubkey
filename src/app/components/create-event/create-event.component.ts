import { Component, Inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Event, getEventHash } from "nostr-tools";
import { MatSnackBar } from '@angular/material/snack-bar';
import { NostrService } from '../../services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { GifService } from 'src/app/services/gif.service';
import { ImageServiceService } from 'src/app/services/image-service.service';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { HeaderComponent } from '../header/header.component';
import { Content } from 'src/app/types/post';
import { NIP10Result } from 'nostr-tools/lib/nip10';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { DBUser, User, dbUserToUser } from 'src/app/types/user';

interface Replacement {
    username: string;
    npub: string;
}

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent implements AfterViewInit {
    @ViewChild("noteTextArea", {read: ElementRef, static: true}) noteField: ElementRef;
    user: User | undefined | null = undefined;
    showGifSearch: boolean = false;
    content: string = "";
    contentHTML: string = "";
    gifSearch: string = "";
    gifsFound: string[] = [];
    selectedFiles?: FileList;
    selectedFileNames: string[] = [];
    showProgressBar: boolean = false;
    previews: Array<string> = [];
    showPlaceholder: boolean = true;
    emptyNIP10: NIP10Result;
    potentialUsers: Array<User> = [];
    usernameReplacements: Array<Replacement> = [];

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private snackBar: MatSnackBar,
        private gifService: GifService,
        private imageService: ImageServiceService,
        private _bottomSheetRef: MatBottomSheetRef<HeaderComponent>,
        private dbService: NgxIndexedDBService,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: JSON,
    ) {
        this.getUser();
    }

    
    ngAfterViewInit() {
        this.focusOnTextField();
    }

    focusOnTextField() {
        // setTimeout sort of makes this work
        setTimeout(() => {
            this.noteField.nativeElement.focus();
        }, 500);
    }

    updateContent(newContent: string) {
        this.content = newContent;
        this.setPotentialNames();
    }

    setPotentialNames(): void {
        this.potentialUsers = [];
        let maybeName = this.lastWord(this.content)
        if (maybeName.startsWith("@") && maybeName.length > 1) {
            const username = maybeName.slice(1);
            this.filterNameLike(username);
        } else {
            this.potentialUsers = [];
        }
    }

    lastWord(words: string) {
        var n = words.split(/[\s,]+/) ;
        return n[n.length - 1];
    }

    filterNameLike(username: string): void {
        this.dbService.getAll("users")
        .subscribe((results: DBUser[]) => {
            for(const u of results) {
                if (u === undefined) {
                    continue;
                }
                if (u.username.includes(username) || u.displayName.includes(username)) {
                    const foundU = dbUserToUser(u);
                    if (!this.potentialUsers.includes(foundU)) {
                        this.potentialUsers.push(foundU);
                    }
                }
            }
        });
    }

    addUserToContent(user: User) {
        const r: Replacement = {
            username: `@${user.username}`,
            npub: `nostr:${user.npub}`
        }
        this.usernameReplacements.push(r);
        this.potentialUsers = [];
        let last = this.lastWord(this.content)
        this.content = this.content.replace(last, `@${user.username}`);
        this.stylizeContent();
        // adding no-break space allows subsequent text to avoid being styled
        this.contentHTML = this.contentHTML + "\u00A0" + "<div></div>"
    }

    stylizeContent() {
        this.contentHTML = new Content(1, this.content, this.emptyNIP10).parseCreateNote();
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
        this.stylizeContent();
        this.selectedFileNames = [];
        this.selectedFiles = event.target.files;
        if (this.selectedFiles && this.selectedFiles[0]) {
            const reader = new FileReader();
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
        this.stylizeContent();
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

    getFinalContent() {
        this.usernameReplacements.forEach(replacement => {
            this.content = this.content.replace(replacement.username, replacement.npub);
        });
        return `${this.content} ${this.previews.join(' ')}`
    }

    async sendEvent() {
        const privateKey = this.signerService.getPrivateKey();
        let finalContent: string = this.getFinalContent();
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

    async sendReply() {
        if (this.data) {
            const privateKey = this.signerService.getPrivateKey();
            let finalContent: string = this.getFinalContent();
            let tags: string[][] = [];
            if (this.data['rootEvent']) {
                if (this.data['rootEvent'] !== this.data['post']['noteId']) {
                    tags.push(["e", this.data['rootEvent'], "", "root"])
                    tags.push(["e", this.data['post']['noteId'], "", "reply"])
                }
            } else {
                tags.push(["e", this.data['post']['noteId'], "", "root"])
            }
            tags.push(["p", this.data['post']['pubkey']]);
            let unsignedEvent = this.nostrService.getUnsignedEvent(1, tags, finalContent);
            let signedEvent: Event;
            if (privateKey !== "") {
                let eventId = getEventHash(unsignedEvent)
                signedEvent = this.nostrService.getSignedEvent(eventId, privateKey, unsignedEvent);
            } else {
                signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
            }
            this.nostrService.sendEvent(signedEvent);
            this.content = "";
            this.openSnackBar("Reply Sent!", "Dismiss");
            this.gifsFound = [];
            this.previews = [];
            this.exitBottomSheet();
        }
    }
}
