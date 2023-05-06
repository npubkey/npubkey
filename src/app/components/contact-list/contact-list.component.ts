import { Component, OnInit } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { NostrService } from 'src/app/services/nostr.service';

import { Filter } from 'nostr-tools';
import { User } from 'src/app/types/user';

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.css']
})
export class ContactListComponent implements OnInit {

    contactSelected: boolean = false;
    contactList: string[] = [];
    users: User[] = [];

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService
    ) {}

    ngOnInit() {
        this.getContactList();
    }

    async getFollowingUsers(contactList: string[]) {
        let filter: Filter = {authors: contactList}
        this.users = await this.nostrService.getKind0(filter);
    }

    async getContactList() {
        let pubkey = this.signerService.getPublicKey();
        let filter: Filter = {kinds: [3], limit: 1, authors: [pubkey]}
        let contactList = await this.nostrService.getKind3(filter);
        this.getFollowingUsers(contactList)
    }
}
