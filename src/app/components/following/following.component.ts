import { Component, OnInit } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from "../../types/user";
import { Filter} from 'nostr-tools';
import { SignerService } from 'src/app/services/signer.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-following',
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.css']
})
export class FollowingComponent implements OnInit {
    npub: string;

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private route: ActivatedRoute,
    ) {
        this.npub = this.route.snapshot.paramMap.get('npub') || "";
        route.params.subscribe(val => {
            this.npub = val["npub"];
            this.getContactList();
        });
    }

    users: User[] = [];

    ngOnInit(): void {}

    async getFollowingUsers(contactList: string[]) {
        let filter: Filter = {authors: contactList, limit: 30}
        console.log(filter);
        this.users = await this.nostrService.getKind0(filter);
        console.log(this.users);
    }

    async getContactList() {
        let pubkey = this.signerService.pubkey(this.npub);
        let filter: Filter = {kinds: [3], limit: 1, authors: [pubkey]}
        let contactList = await this.nostrService.getKind3(filter);
        if (pubkey === this.signerService.getPublicKey()) {
            this.signerService.setFollowingList(contactList);
        }
        console.log("contact list")
        console.log(contactList);
        this.getFollowingUsers(contactList)
    }
}
