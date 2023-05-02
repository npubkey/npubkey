import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateEventComponent } from './components/create-event/create-event.component';
import { UsersComponent } from './components/users/users.component';
import { FeedComponent } from './components/feed/feed.component';
import { MessengerComponent } from './components/messenger/messenger.component';
import { LoginComponent } from './components/login/login.component';
import { GenerateComponent } from './components/generate/generate.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { SearchComponent } from './components/search/search.component';

const routes: Routes = [
    { path: 'generate', component: GenerateComponent },
    { path: 'login', component: LoginComponent },
    { path: 'users', component: UsersComponent },
    { path: 'create', component: CreateEventComponent },
    { path: 'feed', component: FeedComponent },
    { path: 'messages', component: MessengerComponent },
    { path: 'users/:npub', component: UserDetailComponent },
    { path: 'profile', component: ProfileComponent},
    { path: 'profile-edit', component: ProfileEditComponent},
    { path: 'search', component: SearchComponent},
];


@NgModule({
    imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'top'})],
    exports: [RouterModule]
})

export class AppRoutingModule { }