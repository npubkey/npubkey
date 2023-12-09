import { Component, Input } from '@angular/core';
import { User } from 'src/app/types/user';

@Component({
  selector: 'app-listed-user',
  templateUrl: './listed-user.component.html',
  styleUrls: ['./listed-user.component.css']
})
export class ListedUserComponent {
    @Input() user?: User;
    @Input() showBio?: boolean = true;
    @Input() showPayButton?: boolean = false;
}
