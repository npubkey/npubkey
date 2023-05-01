import { Component, Input } from '@angular/core';
import { Post } from '../../types/post';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent {
    @Input() post?: Post;
}
