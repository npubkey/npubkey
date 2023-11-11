import { Component, OnInit, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { DBUser, User, dbUserToUser } from 'src/app/types/user';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { PostComponent } from '../post/post.component';
import { NostrService } from 'src/app/services/nostr.service';
import { Filter } from 'nostr-tools';

@Component({
  selector: 'app-user-bottom-sheet',
  templateUrl: './user-bottom-sheet.component.html',
  styleUrls: ['./user-bottom-sheet.component.css']
})
export class UserBottomSheetComponent implements OnInit {

    user: User;
    pubkey: string;
    nip05Verified: boolean = false;
    loading: boolean = true;

    constructor(
        private _bottomSheetRef: MatBottomSheetRef<PostComponent>,
        private nostrService: NostrService,
        private dbService: NgxIndexedDBService,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: JSON,
    ) {
        this.pubkey = data['pubkey'];
    }

    ngOnInit() {
        this.getUser();
    }

    async getUser() {
        this.dbService.getAll("users")
        .subscribe((results: DBUser[]) => {
            for(const u of results) {
                if (u === undefined) {
                    continue;
                }
                if (u.pubkey == this.pubkey) {
                    this.user = dbUserToUser(u);
                    this.loading = false;
                    break;
                }
            }
            if (this.user === undefined) {
                console.log("USER STILL NOT FOUND GETTING")
                this.getUserFromNostr();
            }
        });
    }

    async awaitUser() {
        
    }

    async getUserFromNostr() {
        let filter: Filter = {authors: [this.pubkey]}
        const users: User[] = await this.nostrService.getKind0(filter);
        if (users.length > 0) {
            this.loading = false;
            this.user = users[0];
        } else {
            this.loading = false;
        }
    }

    closeBottomSheet() {
        this._bottomSheetRef.dismiss();
    }
}
