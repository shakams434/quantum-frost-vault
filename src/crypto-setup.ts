// src/crypto-setup.ts
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2';

// Necesario en v2.x: función SINCRÓNICA
ed.etc.sha512Sync = (...msgs: Uint8Array[]) => sha512(ed.etc.concatBytes(...msgs));

export { ed };