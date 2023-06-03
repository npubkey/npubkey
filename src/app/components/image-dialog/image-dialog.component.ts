import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-image-dialog',
  templateUrl: './image-dialog.component.html',
  styleUrls: ['./image-dialog.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ImageDialogComponent {

    constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

}
