import { Pipe, PipeTransform } from '@angular/core';
import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

@Pipe({
  name: 'humantime'
})
export class HumantimePipe implements PipeTransform {

    transform(value: number): string {
        let date = new Date(value*1000)
        return dayjs(date).fromNow()
    }
}
