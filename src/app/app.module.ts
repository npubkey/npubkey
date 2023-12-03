import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from './components/header/header.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import {APP_BASE_HREF} from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpCacheInterceptorModule } from '@ngneat/cashew';

// Material
import { MatDialogModule } from '@angular/material/dialog';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FeedComponent } from './components/feed/feed.component';
import { PostComponent } from './components/post/post.component';
import { SettingsComponent } from './components/settings/settings.component';
import { LoginComponent } from './components/login/login.component';
import { RelayComponent } from './components/relay/relay.component';
import { CreateEventComponent } from './components/create-event/create-event.component';
import { AppRoutingModule } from './app-routing.module';
import { UsersComponent } from './components/users/users.component';
import { MessengerComponent } from './components/messenger/messenger.component';
import { UserComponent } from './components/user/user.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { Kind1Component } from './components/kind1/kind1.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { UsernamePipe } from './pipes/username.pipe';
import { SearchComponent } from './components/search/search.component';
import { NpubPipe } from './pipes/npub.pipe';
import { HashtagPipe } from './pipes/hashtag.pipe';
import { SafePipe } from './pipes/safe.pipe';
import { TruncatePipe } from './pipes/truncate.pipe';
import { FollowingComponent } from './components/following/following.component';
import { PostDetailComponent } from './components/post-detail/post-detail.component';
import { NeventPipe } from './pipes/nevent.pipe';
import { EllipsisPipe } from './pipes/ellipsis.pipe';
import { ContactListComponent } from './components/contact-list/contact-list.component';
import { HumantimePipe } from './pipes/humantime.pipe';
import { FollowComponent } from './components/follow/follow.component';
import { LoadingComponent } from './components/loading/loading.component';
import { HashtagFeedComponent } from './components/hashtag-feed/hashtag-feed.component';
import { ZapComponent } from './components/zap/zap.component';

// indexed db
import { NgxIndexedDBModule, DBConfig } from 'ngx-indexed-db';
import { ImageDialogComponent } from './components/image-dialog/image-dialog.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { NotificationComponent } from './components/notification/notification.component';

// webln and nostr window
import { WebLNProvider } from '@webbtc/webln-types';
import { NostrWindow } from './types/nostr';
import { ListedUserComponent } from './components/listed-user/listed-user.component';
import { TrendingComponent } from './components/trending/trending.component';
import { ZapFeedComponent } from './components/zap-feed/zap-feed.component';
import { HomeFeedComponent } from './components/home-feed/home-feed.component';
import { UserBottomSheetComponent } from './components/user-bottom-sheet/user-bottom-sheet.component';
import { WalletComponent } from './components/wallet/wallet.component';
import { KeyboardPipe } from './pipes/keyboard.pipe';
import { PaymentRequestComponent } from './components/payment-request/payment-request.component';
import { SendPaymentComponent } from './components/send-payment/send-payment.component';

// Ahead of time compiles requires an exported function for factories
export function migrationFactory() {
    // The animal table was added with version 2 but none of the existing tables or data needed
    // to be modified so a migrator for that version is not included.
    return {
      1: (db, transaction) => {
        const store = transaction.objectStore('users');
        store.createIndex('users', 'users', { unique: false });
      },
      3: (db, transaction) => {
        const store = transaction.objectStore('notifications');
        store.createIndex('notifications', 'notifications', { unique: false });
      }
    };
}


const dbConfig: DBConfig  = {
    name: 'npubkeydb',
    version: 3,
    objectStoresMeta: [
        {
            store: 'users',
            storeConfig: { keyPath: 'id', autoIncrement: true },
            storeSchema: [
                { name: 'name', keypath: 'name', options: { unique: false } },
                { name: 'username', keypath: 'username', options: { unique: false } },
                { name: 'displayName', keypath: 'displayName', options: { unique: false } },
                { name: 'website', keypath: 'website', options: { unique: false } },
                { name: 'about', keypath: 'about', options: { unique: false } },
                { name: 'picture', keypath: 'picture', options: { unique: false } },
                { name: 'banner', keypath: 'banner', options: { unique: false } },
                { name: 'lud06', keypath: 'lud06', options: { unique: false } },
                { name: 'lud16', keypath: 'lud16', options: { unique: false } },
                { name: 'nip05', keypath: 'nip05', options: { unique: false } },
                { name: 'pubkey', keypath: 'pubkey', options: { unique: true } },
                { name: 'npub', keypath: 'npub', options: { unique: true } },
                { name: 'createdAt', keypath: 'createdAt', options: { unique: false } },
                { name: 'apiKey', keypath: 'apiKey', options: { unique: false } },
                { name: 'following', keypath: 'following', options: {unique: false}}
            ]
        },
        {
            store: 'notifications',
            storeConfig: { keyPath: 'id', autoIncrement: true},
            storeSchema: [
                { name: 'kind', keypath: 'kind', options: {unique: false} },
                { name: 'walletPubkey', keypath: 'walletPubkey', options: {unique: false} },
                { name: 'walletNpub', keypath: 'walletNpub', options: {unique: false} },
                { name: 'createdAt', keypath: 'createdAt', options: {unique: false} },
                { name: 'username', keypath: 'username', options: {unique: false} },
                { name: 'picture', keypath: 'picture', options: {unique: false} },
                { name: 'receiverPubKey', keypath: 'receiverPubKey', options: {unique: false} },
                { name: 'receiverNpub', keypath: 'receiverNpub', options: {unique: false} },
                { name: 'receiverEventId', keypath: 'receiverEventId', options: {unique: false} },
                { name: 'senderPubkey', keypath: 'senderPubkey', options: {unique: false} },
                { name: 'senderNpub', keypath: 'senderNpub', options: {unique: false} },
                { name: 'senderMessage', keypath: 'senderMessage', options: {unique: false} },
                { name: 'bolt11', keypath: 'bolt11', options: {unique: false} },
                { name: 'preImage', keypath: 'preImage', options: {unique: false} },
                { name: 'description', keypath: 'description', options: {unique: false} },
                { name: 'fromNow', keypath: 'fromNow', options: {unique: false} },
                { name: 'content', keypath: 'content', options: {unique: false} },
                { name: 'satAmount', keypath: 'satAmount', options: {unique: false}},
            ]
        }
    ],
    migrationFactory
};

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidebarComponent,
    FeedComponent,
    PostComponent,
    SettingsComponent,
    LoginComponent,
    RelayComponent,
    CreateEventComponent,
    UsersComponent,
    MessengerComponent,
    UserComponent,
    UserDetailComponent,
    Kind1Component,
    ProfileEditComponent,
    UsernamePipe,
    SearchComponent,
    NpubPipe,
    HashtagPipe,
    SafePipe,
    TruncatePipe,
    FollowingComponent,
    PostDetailComponent,
    NeventPipe,
    EllipsisPipe,
    ContactListComponent,
    HumantimePipe,
    FollowComponent,
    LoadingComponent,
    HashtagFeedComponent,
    ZapComponent,
    ImageDialogComponent,
    NotificationsComponent,
    NotificationComponent,
    ListedUserComponent,
    TrendingComponent,
    ZapFeedComponent,
    HomeFeedComponent,
    UserBottomSheetComponent,
    WalletComponent,
    KeyboardPipe,
    PaymentRequestComponent,
    SendPaymentComponent,
  ],
  //entryComponents: [ImageDialogComponent, CreateEventComponent, UserBottomSheetComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    HttpCacheInterceptorModule.forRoot(),
    MatIconModule,
    MatCheckboxModule,
    MatSliderModule,
    MatToolbarModule,
    MatMenuModule,
    MatCardModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatChipsModule,
    MatButtonModule,
    MatBadgeModule,
    MatDividerModule,
    MatListModule,
    MatExpansionModule,
    MatTabsModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    MatGridListModule,
    FlexLayoutModule,
    MatBottomSheetModule,
    MatSnackBarModule,
    AppRoutingModule,
    QRCodeModule,
    InfiniteScrollModule,
    NgxIndexedDBModule.forRoot(dbConfig),
    ReactiveFormsModule,
  ],
  providers: [{provide: APP_BASE_HREF, useValue: '/'}],
  bootstrap: [AppComponent]
})
export class AppModule { }


declare global {
    interface Window {
      webln?: WebLNProvider;
      nostr?: NostrWindow;
    }
}
