import { Component, OnInit } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { SignerService } from 'src/app/services/signer.service';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
    title: string = 'Relay Linker';
    home_icon: string = 'home';
    key_icon: string = "key";
    explore_icon: string = 'explore';
    users_icon: string = 'people_outline';
    create_icon: string = 'add_photo_alternate';
    menu_icon: string = 'account_circle';
    messages_icon: string = 'forum';
    notifications_icon: string = 'notifications';
    search_icon: string = 'search';

    constructor(
        private signerService: SignerService,
        private nostrService: NostrService
    ) {}

    ngOnInit() {
        // because the header will always be on the screen,
        // put some stuff in here we want on start
        let pubkey = this.signerService.getPublicKey();
        if (pubkey) {
            // poorly named but this will save our following list
            this.nostrService.getKind3({authors: [pubkey], limit: 1})
        }
    }
}
