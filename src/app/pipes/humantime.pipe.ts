import { Pipe, PipeTransform } from '@angular/core';
import { humantime } from '../utils';
import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

@Pipe({
  name: 'humantime'
})
export class HumantimePipe implements PipeTransform {

    transform(value: number): string {
        return humantime(value);
    }
}
