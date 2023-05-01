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
    nip05?: string;
    // can have other random shit in here too
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
    nip05: string = "";
    publicKey: string;
    createdAt: number;
    constructor(kind0: Kind0Content, createdAt: number, publicKey: string) {
        this.name = kind0.name || "";
        this.username = kind0.username || "";
        this.displayName = kind0.displayName || this.name || this.username || "No Name";
        this.website = this.getClickableWebsite(kind0.website || "");
        this.about = kind0.about || "";
        this.picture = kind0.picture || "https://axiumradonmitigations.com/wp-content/uploads/2015/01/icon-user-default.png";
        this.banner = kind0.banner || "";
        this.lud06 = kind0.lud06 || "";
        this.nip05 = kind0.nip05 || "";
        this.createdAt = createdAt;
        this.publicKey = publicKey;
    }

    getClickableWebsite(link: string) {
        if (link === "") return link;
        if (link.startsWith("http://") || link.startsWith("https://")) {
            return link;
        }
        return `http://${link}`;
    }
}
