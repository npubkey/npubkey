import { Component } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent {
    diameter: number = 100;
    strokeWidth: number = 100;
    color: ThemePalette = 'accent';
    mode: ProgressSpinnerMode = 'indeterminate';
    // value = 50;
}
