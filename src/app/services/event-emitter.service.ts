import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventEmitterService {

//   private loginEventMessageSource = new Subject<boolean>();
//   loginMessage$ = this.loginEventMessageSource.asObservable();

  private pageBottomReachedEventSource = new Subject<boolean>();
  loadMorePosts$ = this.pageBottomReachedEventSource.asObservable();

//   private usernameUpdateSource = new Subject<string>();
//   updateUsername$ = this.usernameUpdateSource.asObservable();

  constructor() { }

//   sendMessage(message: boolean) {
//     this.loginEventMessageSource.next(message);
//   }

  sendLoadMoreMessage(message: boolean) {
    this.pageBottomReachedEventSource.next(message);
  }

//   sendUpdateUsername(username: string) {
//     console.log('sedning new username');
//     this.usernameUpdateSource.next(username);
//   }
}