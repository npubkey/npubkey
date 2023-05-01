import { Component, OnInit } from '@angular/core';
import { NostrServiceService } from 'src/app/services/nostr-service.service';
import { User } from "../../types/user";
import { Filter} from 'nostr-tools';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

    constructor(private nostrService: NostrServiceService) {}

    users: User[] = [];

    ngOnInit(): void {
        this.getUsers();
        console.log("getting users")
    }

    async getUsers() {
        let filter: Filter = {limit: 30}
        this.users = await this.nostrService.getKind0(filter);
    }
}
