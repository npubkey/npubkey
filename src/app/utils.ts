import { Post } from 'src/app/types/post';
import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);


export class Paginator {
    previousUntil: number | null;
    previousSince: number | null;
    until: number = 0;
    since: number = 0;
    baseTimeDiff: number;
    originalBaseTimeDiff: number;
    constructor(until: number = 0, since: number = 0, baseTimeDiff: number = 5) {
        this.until = until;
        this.setDefaultUntil();
        this.baseTimeDiff = baseTimeDiff;
        this.originalBaseTimeDiff = this.baseTimeDiff;
        if (since === 0) {
            this.setDefaultSince()
        } else {
            this.setDefaultSince(since);
        }
        this.previousSince = since;
        this.previousUntil = until;
    }

    incrementFilterTimes(posts: Post[]): void {
        const oldestPost = posts.at(-1);
        if (oldestPost) {
            this.revertBackToOriginalBaseTimeDiff();
            this.setUntil(oldestPost.createdAt);
            this.setSince(oldestPost.createdAt);
        } else {
            // posts must be empty so increment more
            this.updateBaseTimeToFindPosts();
            this.setDefaultUntil();
            // expand time until we find something
            this.setDefaultSince();
        }
    }

    resetFilterTimes(newBaseTimeDiff: number = 0): void {
        this.setDefaultSince();
        this.setDefaultUntil();
        if (newBaseTimeDiff !== 0) {
            this.baseTimeDiff = newBaseTimeDiff;
        }
    }

    updateBaseTimeToFindPosts() {
        this.baseTimeDiff = this.baseTimeDiff * 10;
    }

    revertBackToOriginalBaseTimeDiff() {
        // revert back once we have found posts
        this.baseTimeDiff = this.originalBaseTimeDiff;
    }

    getSinceAsDate(): Date {
        return new Date(this.since*1000);
    }

    getUntilAsDate(): Date {
        return new Date(this.until*1000);
    }

    getSinceFromNow(): string {
        const sinceDate = this.getSinceAsDate();
        return dayjs(sinceDate).fromNow();
    }

    getUntilFromNow(): string {
        const untilDate = this.getSinceAsDate();
        return dayjs(untilDate).fromNow();
    }

    printTimes(): void {
        const diff = this.getUntilAsDate().getTime() - this.getSinceAsDate().getTime();
        console.log(`Until: ${this.getUntilFromNow()} | Since: ${this.getSinceFromNow()}`);
        console.log(`Diff: ${diff}`);
    }

    printVars(): void {
        console.log(`Until: ${this.until}`);
        console.log(`Since: ${this.since}`);
        console.log(`baseTimeDiff: ${this.baseTimeDiff}`);
    }

    private setDefaultSince(addedMinutes: number = 0): void {
        // Math.floor(Date.now() / 1000)
        let now = new Date();
        const sinceDate = Math.floor(now.setMinutes(now.getMinutes() - this.baseTimeDiff - addedMinutes) / 1000);
        this.since = sinceDate;
    }

    private setDefaultUntil(): void {
        this.until = Math.floor(Date.now() / 1000);
    }

    private getNewSince(createdAt: number, addedMinutes: number = 0): number {
        const now = new Date(createdAt*1000);
        return Math.floor(now.setMinutes(now.getMinutes() - this.baseTimeDiff - addedMinutes) / 1000);
    }

    private setUntil(createdAt: number): void {
        this.previousUntil = this.until - (2 * 1000) // minus two minutes;
        this.until = createdAt;
    }

    private setSince(createdAt: number, addedMinutes: number = 0): void {
        this.previousSince = this.since;
        this.since = this.getNewSince(createdAt, addedMinutes);
    }
}
