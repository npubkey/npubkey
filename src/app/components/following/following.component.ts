import { Component, OnInit } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from "../../types/user";
import { Filter} from 'nostr-tools';
import { SignerService } from 'src/app/services/signer.service';

@Component({
  selector: 'app-following',
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.css']
})
export class FollowingComponent {
    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
    ) {}

    users: User[] = [];

    ngOnInit(): void {
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
        console.log(contactList);
        this.getFollowingUsers(contactList)
    }
}
