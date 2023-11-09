import { Component } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { Zap } from 'src/app/types/post';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent {

    notifications: Zap[];
    loading: boolean = true;
    constructor(
        private nostrService: NostrService
    ) {
        this.getZapNotifications();
    }

    async getZapNotifications() {
        this.notifications = await this.nostrService.getNotifications();
        this.loading = false;
    }

}
