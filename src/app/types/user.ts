import { nip19 } from 'nostr-tools';

// kind 0 content - nostr
export interface Kind0Content {
    name?: string;
    username?: string;
    displayName?: string;
    website?: string;
    about?: string;
    picture?: string;
    banner?: string;
    lud06?: string;
    lud16?: string;
    nip05?: string;
    // can have other random shit in here too
}

export interface SearchUser {
    pubkey: string,
    picture: string
}


export class BaseUser {
    pubkey: string;
    name: string;
    constructor(pubkey: string, name: string) {
        this.pubkey = pubkey;
        this.name = name;
    }
}

/* 
    Preprocesses a kind0 message into a User class to be nicely accessible
*/
export class User {
    name: string = "";
    username: string = "";
    displayName: string = "";
    website: string = "";
    about: string = "";
    picture: string = "";
    banner: string = "";
    lud06: string = "";
    lud16: string = "";
    nip05: string = "";
    pubkey: string;
    npub: string;
    createdAt: number;
    constructor(kind0: Kind0Content, createdAt: number, pubkey: string) {
        this.name = kind0.name || "";
        this.username = kind0.username || "";
        this.displayName = kind0.displayName || this.name || this.username || "No Name";
        this.website = this.getClickableWebsite(kind0.website || "");
        this.about = kind0.about || "";
        this.picture = kind0.picture || "https://axiumradonmitigations.com/wp-content/uploads/2015/01/icon-user-default.png";
        this.banner = kind0.banner || "";
        this.lud06 = kind0.lud06 || "";
        this.lud16 = kind0.lud16 || "";
        this.nip05 = kind0.nip05 || "";
        this.createdAt = createdAt;
        this.pubkey = pubkey;
        this.npub = nip19.npubEncode(this.pubkey);
        this.cachePubkeyDisplayName()
    }

    getClickableWebsite(link: string) {
        if (link === "") return link;
        if (link.startsWith("http://") || link.startsWith("https://")) {
            return link;
        }
        return `http://${link}`;
    }

    cachePubkeyDisplayName() {
        localStorage.setItem(`${this.pubkey}`, this.displayName);
    }
}
