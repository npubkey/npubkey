import { Component, OnInit, OnDestroy } from '@angular/core';

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

    ngOnInit() {}
}
