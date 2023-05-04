import { Pipe, PipeTransform } from '@angular/core';
import { nip19 } from 'nostr-tools';

@Pipe({
  name: 'nevent'
})
export class NeventPipe implements PipeTransform {

    transform(value: string): string {
        if (value === "") {
            return value;
        }
        let event: nip19.EventPointer = {id: value}
        return nip19.neventEncode(event);
    }
}
