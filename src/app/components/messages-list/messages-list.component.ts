import { Component, OnInit } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { User, DBUser, dbUserToUser } from 'src/app/types/user';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { SignerService } from 'src/app/services/signer.service';

@Component({
  selector: 'app-messages-list',
  templateUrl: './messages-list.component.html',
  styleUrls: ['./messages-list.component.css']
})
export class MessagesListComponent implements OnInit{

    messagedPubkeys: string[] = [];
    messagedUsers: User[] = [];
    selfPubkey: string;

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService,
        private dbService: NgxIndexedDBService
    ) {
        this.selfPubkey = this.signerService.getPublicKey();
    }

    ngOnInit(): void {
        this.getMessagedUsersList();
    }

    async getMessagedUsersList() {
        const messagesList = await this.nostrService.getKind4MessagesToMe();
        messagesList.forEach(el => {
            console.log(el);
            if (el.pubkey != this.selfPubkey) {
                this.messagedPubkeys.push(el.pubkey);
            } else {
                this.messagedPubkeys.push(el.tags[0][1])
            }
        });
        this.getMessagedUsersFromDB();
    }

    getMessagedUsersFromDB() {
        this.dbService.getAll("users")
        .subscribe((results: DBUser[]) => {
            for(const u of results) {
                if (u === undefined) {
                    continue;
                }
                if (this.messagedPubkeys.includes(u.pubkey)) {
                    this.messagedUsers.push(dbUserToUser(u));
                }
            }
        });
    }
}
