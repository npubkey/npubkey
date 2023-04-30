import { Component, OnInit } from '@angular/core';
import { NostrServiceService } from 'src/app/services/nostr-service.service';
import { Kind0Content, User } from "../../types/user";

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
    }

    async getUsers() {
        let response = await this.nostrService.getKind0(30)
        for (let r in response) {
            let kind0 = JSON.parse(response[r].content)
            const user = new User(kind0);
            console.log(user);
            this.users.push(user);
        }
    }
}
