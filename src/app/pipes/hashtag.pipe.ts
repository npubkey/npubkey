import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hashtag'
})
export class HashtagPipe implements PipeTransform {

    transform(content: string, ...args: unknown[]): string {
        let hashtags: string[] = content.match(/#\w+/g) || []
        hashtags.forEach(tag => {
            content = content.replace(tag, `<span class="hashtag">${tag}</a>`)
        });
        return content
    }

}
