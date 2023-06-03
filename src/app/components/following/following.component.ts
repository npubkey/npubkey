import { Component } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from "../../types/user";
import { Filter} from 'nostr-tools';
import { SignerService } from 'src/app/services/signer.service';
import { ActivatedRoute } from '@angular/router';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { DBUser, dbUserToUser } from '../../types/user';

@Component({
  selector: 'app-following',
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.css']
})
export class FollowingComponent {
    loading: boolean = true;
    npub: string;
    pubkey: string;
    followPath: string;
    users: User[] = [];
    contactList: string[] = [];
    viewingOwnFollowing: boolean;

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private route: ActivatedRoute,
        private dbService: NgxIndexedDBService
    ) {
        this.followPath = this.route.snapshot.url.at(-1)?.path || "following";
        this.npub = this.route.snapshot.paramMap.get('npub') || "";
        this.pubkey = this.signerService.pubkey(this.npub);
        this.setViewingOwnFollowing();
        route.params.subscribe(val => {
            this.npub = val["npub"];
            this.pubkey = this.signerService.pubkey(this.npub);
            this.setViewingOwnFollowing();
            this.getContactList();
        });
    }

    async getContactListUsers(contactList: string[]) {
        let filter: Filter = {authors: contactList}
        this.users = await this.nostrService.getKind0(filter);
        this.loading = false;
    }

    async getContactList() {
        if (!this.viewingOwnFollowing) {
            this.getUsersFromNostr();
        } else {
            if (this.followPath === "following") {
                this.getUsersFromDB();
            } else {
                this.getUsersFromNostr();
            }
        }
    }

    async getUsersFromNostr() {
        if (this.followPath === "following") {
            this.contactList = await this.nostrService.getFollowing(this.pubkey);
        } else {
            this.contactList = await this.nostrService.getFollowers(this.pubkey);
        }
        this.getContactListUsers(this.contactList);
    }

    getUsersFromDB() {
        this.dbService.getAll("users")
        .subscribe((results: DBUser[]) => {
            for(const u of results) {
                if (u === undefined) {
                    continue;
                }
                if (u.following) {
                    this.users.push(dbUserToUser(u));
                }
            }
            if (this.users.length === 0) {
                this.getUsersFromNostr();
            }
            this.loading = false;
        });
    }

    setViewingOwnFollowing() {
        if (this.pubkey === this.signerService.getPublicKey()) {
            this.viewingOwnFollowing = true;
        } else {
            this.viewingOwnFollowing = false;
        }
    }

}
