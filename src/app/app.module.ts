import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from './components/header/header.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// Material
import { MatDialogModule } from '@angular/material/dialog';
import { MatSliderModule } from '@angular/material/slider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
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
import { ProfileComponent } from './components/profile/profile.component';
import { PostComponent } from './components/post/post.component';
import { SettingsComponent } from './components/settings/settings.component';
import { LoginComponent } from './components/login/login.component';
import { RelayComponent } from './components/relay/relay.component';
import { GenerateComponent } from './components/generate/generate.component';
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
import { FollowersComponent } from './components/followers/followers.component';
import { EllipsisPipe } from './pipes/ellipsis.pipe';
import { ContactListComponent } from './components/contact-list/contact-list.component';
import { HumantimePipe } from './pipes/humantime.pipe';
import { FollowComponent } from './components/follow/follow.component';
import { LoadingComponent } from './components/loading/loading.component';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidebarComponent,
    FeedComponent,
    ProfileComponent,
    PostComponent,
    SettingsComponent,
    LoginComponent,
    RelayComponent,
    GenerateComponent,
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
    FollowersComponent,
    EllipsisPipe,
    ContactListComponent,
    HumantimePipe,
    FollowComponent,
    LoadingComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MatIconModule,
    MatSliderModule,
    MatToolbarModule,
    MatMenuModule,
    MatCardModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatChipsModule,
    MatButtonModule,
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
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
