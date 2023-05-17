import { Component, Input } from '@angular/core';
import { Zap } from 'src/app/types/post';
import { Router } from '@angular/router';


@Component({
  selector: 'app-zap',
  templateUrl: './zap.component.html',
  styleUrls: ['./zap.component.css']
})
export class ZapComponent {
    @Input() zap?: Zap;

    constructor(
        private router: Router
    ) {}

    processLinks(e: any) {
        // needed when we generate html from incoming text to
        // route a link without getting a 404
        const element: HTMLElement = e.target;
        if (element.nodeName === 'A') {
            e.preventDefault();
            const link = element.getAttribute('href');
            if (link) {
                this.router.navigate([link]).catch((error) => {
                    window.open(link, "_blank");
                });
            }
        }
    }
}
