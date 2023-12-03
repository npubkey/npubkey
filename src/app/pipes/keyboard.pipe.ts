import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'keyboard'
})
export class KeyboardPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    if (value === "") {
        return "0";
    } else {
        return value;
    }
  }

}
