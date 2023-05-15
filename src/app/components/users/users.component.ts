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
    users: User[] = [];
    loading: boolean = true;
    minutesAgo: number = 10;
    previousSince: number = 0;

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
    ) {}

    toggleLoading = () => this.loading = !this.loading;

    ngOnInit(): void {
        this.getUsers();
    }

    getSince(minutesAgo: number) {
        let now = new Date()
        return Math.floor(now.setMinutes(now.getMinutes() - minutesAgo) / 1000)
    }

    incrementFilterTimes() {
        // its not perfect but it does work OK
        // so we don't keep getting the same posts
        this.previousSince = this.minutesAgo;
        this.minutesAgo += 5;
    }

    async getUsers() {
        let filter: Filter = {
            limit: 10,
            since: this.getSince(this.minutesAgo),
            until: this.getSince(this.previousSince)
        }
        let moreUsers = await this.nostrService.getKind0(filter);
        this.users.push(...moreUsers);
        this.incrementFilterTimes();
    }

    async onScroll() {
        this.getUsers();
    }

}
