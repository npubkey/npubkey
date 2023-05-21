import { UnsignedEvent, Event } from "nostr-tools"

export interface NostrWindow {
    getPublicKey: () => Promise<string>
    signEvent: (event: UnsignedEvent) => Promise<Event>
    nip04?: {
        encrypt?: (pubkey: string, plaintext: string) => Promise<string>
        decrypt?: (pubkey: string, ciphertext: string) => Promise<string>
    }
}
