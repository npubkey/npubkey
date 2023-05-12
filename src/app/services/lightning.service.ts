import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LightningResponse, LightningInvoice } from '../types/post';
import { WebLN } from 'src/app/types/webln';

declare global {
    interface Window {
      webln?: WebLN;
    }
}

@Injectable({
  providedIn: 'root'
})
export class LightningService {

    constructor(
        private http: HttpClient
    ) { }

    getLightning(url: string): Observable<LightningResponse> {
        return this.http.get<LightningResponse>(url)
            .pipe(
                catchError(() => of({status: "Failed"} as LightningResponse))
            )
    }

    getLightningInvoice(url: string, amount: string): Observable<LightningInvoice> {
        // amount is in millisats so 5 sats === 5000
        let aUrl = `${url}?amount=${amount}`;
        return this.http.get<LightningInvoice>(aUrl);
    }

    // url would be something like `brah@npubkey.com`
    // which needs to be processed to make the actual request
    getLightningAddress(url: string): string {
        const splitUrl = url.split("@");
        const username = splitUrl[0];
        const domain = splitUrl[1];
        return `https://${domain}/.well-known/lnurlp/${username}`;
    }

    async login(): Promise<boolean> {
        if (window.webln && !window.webln.enabled) {
            await window.webln.enable();
        }
        return true;
    }

    hasWebln() {
        if (window.webln) {
            return true;
        }
        return false;
    }

    async sendPayment(pr: string) {
        return await window.webln?.sendPayment(pr)
    }

    async payInvoice(pr: string) {
        await this.login();
        if (this.hasWebln()) {
          const rsp = await this.sendPayment(pr).catch((error) => {
            return false;
          });
          if (rsp) {
            return true;
          }
          return false;
        } else {
            console.log("WebLN not available");
            return false;
        }
    }
}
