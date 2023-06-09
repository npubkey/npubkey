import { Component, OnInit, Input } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { User, dbUserToUser } from "../../types/user";
import { Filter} from 'nostr-tools';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { DBUser } from '../../types/user';
import { Paginator } from '../../utils';

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
    constructor(
        private nostrService: NostrService,
        private dbService: NgxIndexedDBService
    ) {
        this.paginator = new Paginator(0, 60, 60);
    }

    toggleLoading = () => this.loading = !this.loading;

    ngOnInit(): void {
        this.getUsers();
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
    }

    async onScroll() {
        this.getUsers();
    }

}
