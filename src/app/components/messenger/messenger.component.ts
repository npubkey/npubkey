import { Component, OnInit } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from "../../types/user";
import { getEventHash, Event, nip19, nip04, Filter } from 'nostr-tools';
import { SignerService } from 'src/app/services/signer.service';
import { ActivatedRoute } from '@angular/router';


interface Message {
    content: string;
    npub: string;
    createdAt: number;
}

@Component({
  selector: 'app-messenger',
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.css']
})
export class MessengerComponent implements OnInit {

    contactSelected: boolean = false;
    friendNPub: string;
    myNPub: string;
    content: string = "";
    messages: Message[] = [];
    pubkeyTag: string = "#p";
    friend: User | undefined;
    me: User | undefined;
    userNotFound: boolean = false;

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private route: ActivatedRoute
    ) {
        this.myNPub = this.signerService.npub();
        this.friendNPub = this.route.snapshot.paramMap.get('npub') || "";
        route.params.subscribe(val => {
            this.friendNPub = val["npub"];
            this.getFriend()
            this.getMe();
            this.getMessages();
        });
    }

    ngOnInit(): void {
        // idk
    }

    async getMe() {
        let filter: Filter = {authors: [this.signerService.getPublicKey()], kinds: [0], limit: 1}
        let why = await this.nostrService.getUser(filter);
        if (why) {
            this.me = why;
        }
    }

    async getFriend() {
        const pubkey: string = nip19.decode(this.friendNPub).data.toString();
        const filter: Filter = {authors: [pubkey], limit: 1}
        let users = await this.nostrService.getKind0(filter);
        if (users.length > 1) {
            this.friend = users[0];
        } else if (users.length === 0) {
            console.log("user not found"); // TODO: these should output info to the user
        } else {
            this.friend = users[0];
        }
        if (this.friend) {
            this.friend = users[0];
        } else {
            this.userNotFound = true;
        }
    }

    async getMessages() {
        let fromPubKey = nip19.decode(this.friendNPub).data.toString();
        let toPubkey = this.signerService.getPublicKey()
        let filter: Filter = {kinds: [4], authors: [fromPubKey, toPubkey], "#p": [toPubkey]}
        let dmEvents: Event[] = await this.nostrService.getKind4(filter)
        for (let e in dmEvents) {
            let decryptedContent = await this.decryptCipherText(dmEvents[e].pubkey, dmEvents[e].content);
            this.messages.push({content: decryptedContent, npub: nip19.npubEncode(dmEvents[e].pubkey), createdAt: dmEvents[e].created_at});
        }
        this.messages.sort((a,b) => a.createdAt - b.createdAt);
    }

    encryptContent(toPubKey: string, content: string) {
        return this.signerService.signDMWithExtension(toPubKey, content);
        // return nip04.encrypt(sk1, pk2, this.content);
    }

    decryptCipherText(pubkey: string, content: string): Promise<string> {
        return this.signerService.decryptDMWithExtension(pubkey, content);
        // return nip04.encrypt(sk1, pk2, this.content);
    }

    async sendEvent() {
        const privateKey = this.signerService.getPrivateKey();
        let toPubKey = nip19.decode(this.friendNPub).data.toString();
        let toFriendContent: string = await this.encryptContent(toPubKey, this.content);
        let selfPubkey = this.signerService.getPublicKey();
        let selfContent: string = await this.encryptContent(selfPubkey, this.content);
        let toTags = [["p", toPubKey]]
        let selfTags = [["p", selfPubkey]]
        let toFriendUnsignedEvent = this.nostrService.getUnsignedEvent(4, toTags, toFriendContent);
        let toSelfUnsignedEvent = this.nostrService.getUnsignedEvent(4, selfTags, selfContent);
        let toFriendSignedEvent: Event;
        let toSelfSignedEvent: Event;
        if (privateKey !== "") {
            let toFriendEventId = getEventHash(toFriendUnsignedEvent)
            let toSelfEventId = getEventHash(toSelfUnsignedEvent)
            toFriendSignedEvent = this.nostrService.getSignedEvent(toFriendEventId, privateKey, toFriendUnsignedEvent);
            toSelfSignedEvent = this.nostrService.getSignedEvent(toSelfEventId, privateKey, toSelfUnsignedEvent)
        } else {
            toFriendSignedEvent = await this.signerService.signEventWithExtension(toFriendUnsignedEvent);
            toSelfSignedEvent = await this.signerService.signEventWithExtension(toSelfUnsignedEvent);
        }
        this.nostrService.sendEvent(toFriendSignedEvent);
        this.nostrService.sendEvent(toSelfSignedEvent);
    }
}
