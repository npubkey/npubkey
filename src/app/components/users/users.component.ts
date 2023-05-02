import { Component, OnInit } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from "../../types/user";
import { Filter} from 'nostr-tools';
import { SignerService } from 'src/app/services/signer.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
    ) {}

    users: User[] = [];

    ngOnInit(): void {
        this.getContactList();
        this.getUsers();
    }

    async getUsers() {
        let filter: Filter = {limit: 30}
        this.users = await this.nostrService.getKind0(filter);
    }

    async getContactList() {
        let pubkey = this.signerService.getPublicKey();
        let filter: Filter = {kinds: [3], limit: 1, authors: [pubkey]}
        let contactList = await this.nostrService.getKind3(filter);
    }
}
