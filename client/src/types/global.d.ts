// This file tells TypeScript about global variables, like those added by CDN scripts.

interface Window {
  // By adding this, we inform TypeScript that the 'Tone' object
  // might exist on the global 'window' object.
  Tone: any;
}
