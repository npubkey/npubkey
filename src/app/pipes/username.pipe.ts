import { Pipe, PipeTransform } from '@angular/core';
import { SignerService } from '../services/signer.service';

@Pipe({
  name: 'username'
})
export class UsernamePipe implements PipeTransform {

    constructor(private signerService: SignerService) {}

    transform(value: string, ...args: unknown[]): string {
        let maxLength: number = 18;
        let username = this.signerService.getUsername(value);
        return `${username}`.substring(0, maxLength);
    }
}
