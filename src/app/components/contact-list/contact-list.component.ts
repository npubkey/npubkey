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
export class ContactListComponent {

    loading: boolean = true;
    contactSelected: boolean = false;
    contactList: string[] = [];
    users: User[] = [];
    displayedUsers: User[] = [];
    filterText: string = "";

    toggleLoading = () => this.loading = !this.loading;

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService
    ) {
        this.getFollowingUsers();
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

    async getFollowingUsers() {
        let contactList: string[] = this.signerService.getFollowingList()
        let filter: Filter = {authors: contactList}
        this.users = await this.nostrService.getKind0(filter);
        this.displayedUsers = this.users;
        this.toggleLoading();
    }
}
