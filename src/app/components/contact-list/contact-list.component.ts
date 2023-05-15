import { Component, OnInit } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { NostrService } from 'src/app/services/nostr.service';

import { Filter } from 'nostr-tools';
import { User } from 'src/app/types/user';
import { filter } from 'rxjs';

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.css']
})
export class ContactListComponent implements OnInit {

    contactSelected: boolean = false;
    contactList: string[] = [];
    users: User[] = [];
    displayedUsers: User[] = [];
    filterText: string = "";

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService
    ) {}

    ngOnInit() {
        this.getContactList();
    }

    filterContacts() {
        if (this.filterText === "") {
            this.displayedUsers = this.users;
        }
        this.displayedUsers = [];
        this.users.forEach((user) => {
            if (user.displayName.toLowerCase().includes(this.filterText.toLowerCase()) ||
                user.npub.toLowerCase().includes(this.filterText.toLowerCase())) {
                this.displayedUsers.push(user);
            }
        })
    }

    async getFollowingUsers(contactList: string[]) {
        let filter: Filter = {authors: contactList}
        this.users = await this.nostrService.getKind0(filter);
        this.displayedUsers = this.users;
    }

    async getContactList() {
        let pubkey = this.signerService.getPublicKey();
        let contactList = await this.nostrService.getContactList(pubkey);
        this.getFollowingUsers(contactList)
    }
}
