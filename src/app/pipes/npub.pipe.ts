import { Pipe, PipeTransform } from '@angular/core';
import { nip19 } from 'nostr-tools';

@Pipe({
  name: 'npub'
})
export class NpubPipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): string {
    return nip19.npubEncode(value);
  }

}
