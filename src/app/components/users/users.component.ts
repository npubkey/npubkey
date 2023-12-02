import { Component, OnInit, Input } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { User, dbUserToUser } from "../../types/user";
import { Filter} from 'nostr-tools';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { DBUser } from '../../types/user';
import { Paginator } from '../../utils';
import { SearchUser } from '../../types/user';
import { nip19 } from 'nostr-tools';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
    users: User[] = [];
    loading: boolean = true;
    minutesAgo: number = 10;
    previousSince: number = 0;
    dbOut: boolean = false;
    paginator: Paginator;
    search: string = "";
    searchUsers: SearchUser[] = [];

    constructor(
        private nostrService: NostrService,
        private dbService: NgxIndexedDBService,
        private router: Router
    ) {
        this.paginator = new Paginator(0, 60, 60);
    }

    toggleLoading = () => this.loading = !this.loading;

    ngOnInit(): void {
        this.getUsers();
    }

    submit() {
        if (this.search.startsWith("npub")) {
            this.router.navigate([`/users/${this.search}`])
        }
        this.users = [];
        this.toggleLoading();
        this.searchForUsers();
        this.searchUsers = [];
        const items = { ...localStorage };
        let searchTerm = this.search
        for (let key of Object.keys(items)) {
            if (key.includes("_name")) continue;
            if (key.includes("following")) continue;
            if (key.includes("publicKey")) continue;
            if (key.includes("_img")) continue;
            if (this.search.startsWith("npub")) {
                searchTerm = nip19.decode(this.search).data.toString();
            }
            let value = (items as {[key: string]: string})[key].toLowerCase();
            key = key.toLowerCase();
            searchTerm = searchTerm.toLowerCase();
            if (key.toLowerCase().includes(searchTerm)) {
                this.addToFound(key);
            }
            else if (value.includes(searchTerm)) {
                this.addToFound(key);
            }
            else if (searchTerm.includes(key)) {
                this.addToFound(key);
            }
            else if (searchTerm.includes(value)) {
                this.addToFound(key);
            }
        }
        this.toggleLoading();
    }

    addToFound(key: string): void {
        let searchUser: SearchUser = {
            pubkey: key,
            picture: this.getPictureFromPublicKey(key)
        }
        if (!this.searchUsers.includes(searchUser)) {
            this.searchUsers.push(searchUser);
        }
    }

    getPictureFromPublicKey(pubkey: string): string {
        return localStorage.getItem(`${pubkey}_img`) || "";
    }

    async searchForUsers() {
        let users = await this.nostrService.searchUsers(this.search)
        this.searchUsers.push(...users);
    }

    getSince(minutesAgo: number) {
        let now = new Date()
        return Math.floor(now.setMinutes(now.getMinutes() - minutesAgo) / 1000)
    }

    getUsers() {
        if (this.dbOut) {
            this.getUsersFromNostr();
        } else {
            this.dbService.getAll("users")
            .subscribe((results: DBUser[]) => {
                for(const u of results) {
                    this.users.push(dbUserToUser(u));
                }
                this.dbOut = true;
                this.toggleLoading();
            });
        }
    }

    async getUsersFromNostr() {
        let filter: Filter = {
            limit: 50,
            since: this.paginator.since,
            until: this.paginator.until
        }
        let moreUsers = await this.nostrService.getKind0(filter);
        this.users.push(...moreUsers);
        this.users = this.users.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.pubkey === value.pubkey
            ))
        )
        this.paginator.incrementUserTimes(moreUsers);
        this.toggleLoading();
    }

    async onScroll() {
        this.getUsers();
    }

}
