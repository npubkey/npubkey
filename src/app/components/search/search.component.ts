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
        this.searchForPosts();
    }

    getPictureFromPublicKey(pubkey: string): string {
        return localStorage.getItem(`${pubkey}_img`) || "";
    }

    async searchForPosts() {
        this.searchPosts = await this.nostrService.search(this.search);
        this.toggleLoading();
    }
}
