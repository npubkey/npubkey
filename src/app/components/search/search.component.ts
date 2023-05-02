import { Component } from '@angular/core';
import { SearchUser } from '../../types/user';
import { nip19 } from 'nostr-tools';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent {

    search: string = "";
    searchUsers: SearchUser[] = [];

    submit() {
        this.searchUsers = [];
        const items = { ...localStorage };
        console.log(items);
        for (let key of Object.keys(items)) {
            if (key.includes("_name")) continue;
            if (key.includes("following")) continue;
            if (key.includes("publicKey")) continue;
            if (key.includes("_img")) continue;
            if (this.search.startsWith("npub")) {
                this.search = nip19.decode(this.search).data.toString();
            }
            let value = (items as {[key: string]: string})[key].toLowerCase();
            key = key.toLowerCase();
            this.search = this.search.toLowerCase();
            if (key.toLowerCase().includes(this.search)) {
                this.addToFound(key);
            }
            else if (value.includes(this.search)) {
                this.addToFound(key);
            }
            else if (this.search.includes(key)) {
                this.addToFound(key);
            }
            else if (this.search.includes(value)) {
                this.addToFound(key);
            }
        }
    }

    addToFound(key: string): void {
        let searchUser: SearchUser = {
            pubkey: key,
            picture: this.getPictureFromPublicKey(key)
        }
        if (!this.searchUsers.includes(searchUser)) {
            console.log("found user")
            console.log(searchUser);
            this.searchUsers.push(searchUser);
        }
    }

    getPictureFromPublicKey(pubkey: string): string {
        return localStorage.getItem(`${pubkey}_img`) || "";
    }
}
