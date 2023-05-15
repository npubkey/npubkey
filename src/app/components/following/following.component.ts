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
    followPath: string;
    users: User[] = [];
    contactList: string[] = [];

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private route: ActivatedRoute,
    ) {
        this.followPath = this.route.snapshot.url.at(-1)?.path || "following";
        this.npub = this.route.snapshot.paramMap.get('npub') || "";
        route.params.subscribe(val => {
            this.npub = val["npub"];
            this.getContactList();
        });
    }



    ngOnInit(): void {}

    async getContactListUsers(contactList: string[]) {
        let filter: Filter = {authors: contactList, limit: 30}
        this.users = await this.nostrService.getKind0(filter);
    }

    async getContactList() {
        let pubkey = this.signerService.pubkey(this.npub);
        if (this.followPath === "following") {
            this.contactList = await this.nostrService.getFollowing(pubkey);
        } else {
            this.contactList = await this.nostrService.getFollowers(pubkey);
        }
        if (pubkey === this.signerService.getPublicKey()) {
            this.signerService.setFollowingList(this.contactList);
        }
        this.getContactListUsers(this.contactList)
    }
}
