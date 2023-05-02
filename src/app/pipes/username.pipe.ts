import { Pipe, PipeTransform } from '@angular/core';
import { nip19 } from 'nostr-tools';

@Pipe({
  name: 'username'
})
export class UsernamePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): string {
    let maxLength: number = 18;
    return `@${(localStorage.getItem(`${value}`) || nip19.npubEncode(value))}`.substring(0, maxLength);
  }

}
