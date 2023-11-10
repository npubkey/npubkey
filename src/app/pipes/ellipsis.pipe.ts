import { Pipe, PipeTransform } from '@angular/core';
import { ellipsis } from '../utils';

@Pipe({
  name: 'ellipsis'
})
export class EllipsisPipe implements PipeTransform {

  transform(value: string): string {
    return ellipsis(value);
  }

}
