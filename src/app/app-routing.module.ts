import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateEventComponent } from './components/create-event/create-event.component';
import { UsersComponent } from './components/users/users.component';
import { HomeFeedComponent } from './components/home-feed/home-feed.component';
import { MessengerComponent } from './components/messenger/messenger.component';
import { LoginComponent } from './components/login/login.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { SearchComponent } from './components/search/search.component';
import { FollowingComponent } from './components/following/following.component';
import { PostDetailComponent } from './components/post-detail/post-detail.component';
import { MessagesListComponent } from './components/messages-list/messages-list.component';
import { HashtagFeedComponent } from './components/hashtag-feed/hashtag-feed.component';
import { SettingsComponent } from './components/settings/settings.component';
import { authGuard } from './auth.guard';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { TrendingComponent } from './components/trending/trending.component';
import { ZapFeedComponent } from './components/zap-feed/zap-feed.component';
import { WalletComponent } from './components/wallet/wallet.component';
import { ContactListComponent } from './components/contact-list/contact-list.component';


const routes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'login', component: LoginComponent },
    { path: 'create', component: CreateEventComponent, canActivate: [authGuard] },
    { path: 'posts/:nevent', component: PostDetailComponent},
    { path: 'messages/:npub', component: MessengerComponent, canActivate: [authGuard]},
    { path: 'feed/:hashtag', component: HashtagFeedComponent},
    { path: 'feed', component: HomeFeedComponent },
    { path: 'trending', component: TrendingComponent },
    { path: 'messages', component: MessagesListComponent, canActivate: [authGuard]},
    { path: 'new-message', component: ContactListComponent, canActivate: [authGuard]},
    { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard]},
    { path: 'users/:npub/following', component: FollowingComponent},
    { path: 'users/:npub/followers', component: FollowingComponent},
    { path: 'users/:npub', component: UserDetailComponent },
    { path: 'users', component: UsersComponent },
    { path: 'profile', component: UserDetailComponent, canActivate: [authGuard]},
    { path: 'profile-edit', component: ProfileEditComponent, canActivate: [authGuard]},
    { path: 'search', component: SearchComponent},
    { path: 'settings', component: SettingsComponent, canActivate: [authGuard]},
    { path: 'wallet', component: WalletComponent, canActivate: [authGuard]},
    { path: 'zaps', component: ZapFeedComponent},
];


@NgModule({
    imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled', useHash: true})],
    exports: [RouterModule]
})
export class AppRoutingModule { }