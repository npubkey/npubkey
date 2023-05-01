import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kind1',
  templateUrl: './kind1.component.html',
  styleUrls: ['./kind1.component.css']
})
export class Kind1Component {
    @Input() content: string = "";

}
