import { Component, Input } from '@angular/core';
import { Event } from 'nostr-tools';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent {
    @Input() post?: Event;
}
