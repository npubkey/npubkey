import { Component } from '@angular/core';
import { SearchUser } from '../../types/user';
import { nip19 } from 'nostr-tools';
import { Post } from 'src/app/types/post';
import { NostrService } from 'src/app/services/nostr.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent {

    loading: boolean = false;
    search: string = "";
    searchUsers: SearchUser[] = [];
    searchPosts: Post[] = [];

    toggleLoading = () => this.loading = !this.loading;

    constructor(
        private nostrService: NostrService
    ) {}

    submit() {
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

    async searchForPosts() {
        this.searchPosts = await this.nostrService.search(this.search);
        this.toggleLoading();
    }

    async searchForUsers() {
        let users = await this.nostrService.searchUsers(this.search)
        this.searchUsers.push(...users);
        this.searchForPosts();
    }
}
