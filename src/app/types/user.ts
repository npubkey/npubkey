// kind 0 content - nostr
export interface Kind0Content {
    name?: string;
    username?: string;
    display_name?: string;
    website?: string;
    about?: string;
    picture?: string;
    banner?: string;
    lud06?: string;
    nip05?: string;
    // can have other random shit in here too
}


// kind 1 content
export interface Kind1 {
    content: string;
    created_at: number;
    tags: Array<Array<string>>;
}


export class Post {
    content: string = "";
    created_at: number = 0;
    tags: Array<Array<string>> = [];
    constructor(kind1: Kind1) {
        this.content = kind1.content || "";
        this.created_at = kind1.created_at || 0;
        this.tags = kind1.tags || [];
    }
}
/* 
    Preprocesses a kind0 message into a User class to be nicely accessible
*/
export class User {
    name: string = "";
    username: string = "";
    display_name: string = "";
    website: string = "";
    about: string = "";
    picture: string = "";
    banner: string = "";
    lud06: string = "";
    nip05: string = "";
    constructor(kind0: Kind0Content) {
        this.name = kind0.name || "";
        this.username = kind0.username || "";
        this.display_name = kind0.display_name || this.name || this.username || "No Name";
        this.website = this.getClickableWebsite(kind0.website || "");
        this.about = kind0.about || "";
        this.picture = kind0.picture || "https://axiumradonmitigations.com/wp-content/uploads/2015/01/icon-user-default.png";
        this.banner = kind0.banner || "";
        this.lud06 = kind0.lud06 || "";
        this.nip05 = kind0.nip05 || "";
    }

    getClickableWebsite(link: string) {
        if (link === "") return link;
        if (link.startsWith("http://") || link.startsWith("https://")) {
            return link;
        }
        return `http://${link}`;
    }
}
