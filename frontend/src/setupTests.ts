import { TextEncoder, TextDecoder } from 'node:util';
import '@testing-library/jest-dom';

// react-router (and undici) expect TextEncoder in the jsdom environment
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}
