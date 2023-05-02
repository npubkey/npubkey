import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): string {
    let maxLength: number = 35;
    if (value.length > maxLength) {
        return value.substring(0, maxLength) + "...";
    }
    return value;
  }

}
