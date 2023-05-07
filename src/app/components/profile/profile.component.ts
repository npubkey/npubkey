import { Component, OnInit } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
import { 
    Event,
    UnsignedEvent,
    getEventHash,
    signEvent,
    Filter
 } from 'nostr-tools';
import { User } from '../../types/user';
import { Post } from '../../types/post';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

    // Form Fields
    user: User | null | undefined = undefined;
    posts: Post[] = [];

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService
    ) {}

    ngOnInit() {
        // need to make sure we have pubkey
        if (this.signerService.usingNostrBrowserExtension()) {
            // TODO probably make this whole thing flow better 
            // ie if not logged in dont allow this page or something
            this.signerService.handleLoginWithExtension();
        }
        this.getUser();
    }

    async getUser() {
        let filter: Filter = {authors: [this.signerService.getPublicKey()], kinds: [0], limit: 1}
        this.user = await this.nostrService.getUser(filter);
        this.getPosts();
    }

    async getPosts() {
        let filter: Filter = {authors: [this.signerService.getPublicKey()], kinds: [1], limit: 5}
        this.posts = await this.nostrService.getKind1(filter);
    }
}
