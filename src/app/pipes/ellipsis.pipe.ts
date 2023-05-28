import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ellipsis'
})
export class EllipsisPipe implements PipeTransform {

  transform(value: string): string {
    // truncates the middle of the string
    if (value.length < 40) return value;
    let third: number = value.length / 8;
    let finalThird: number = value.length - third;
    return value.substring(0, third) + ":" + value.substring(finalThird)
  }

}
