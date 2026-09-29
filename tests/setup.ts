import '@testing-library/jest-dom/vitest';

// Polyfill window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Polyfill SpeechSynthesis
class MockSpeechSynthesisUtterance {
  text: string;
  lang: string = 'en-GB';
  rate: number = 1;
  onend: any = null;
  constructor(text: string) {
    this.text = text;
  }
}

const mockSpeechSynthesis = {
  speak: (utterance: any) => {
    if (utterance.onend) {
      setTimeout(() => utterance.onend(), 10);
    }
  },
  cancel: () => {},
  pause: () => {},
  resume: () => {},
};

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: MockSpeechSynthesisUtterance,
});

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis,
});

// Polyfill navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: {
    writeText: async () => {},
  },
});

// Polyfill MediaRecorder
class MockMediaRecorder {
  state: string = 'inactive';
  ondataavailable: any = null;
  onstop: any = null;
  stream: any;

  constructor(stream: any) {
    this.stream = stream;
  }

  start() {
    this.state = 'recording';
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(['mock audio'], { type: 'audio/webm' }) });
      }
    }, 0);
  }

  stop() {
    this.state = 'inactive';
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['mock audio'], { type: 'audio/webm' }) });
    }
    if (this.onstop) {
      this.onstop();
    }
  }
}

Object.defineProperty(window, 'MediaRecorder', {
  writable: true,
  value: MockMediaRecorder,
});

// Polyfill navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: async () => ({
      getTracks: () => [{ stop: () => {} }],
    }),
  },
});

// Keep download and extension-navigation tests inside jsdom.
window.open = () => null;
HTMLAnchorElement.prototype.click = () => {};

// Polyfill URL.createObjectURL and revokeObjectURL
window.URL.createObjectURL = () => 'blob:mock-url';
window.URL.revokeObjectURL = () => {};

// Polyfill HTMLMediaElement play/pause and currentTime
let mockCurrentTime = 0;
Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
  get: () => mockCurrentTime,
  set: (val: number) => {
    mockCurrentTime = val;
  },
  configurable: true,
});
HTMLMediaElement.prototype.play = async () => {};
HTMLMediaElement.prototype.pause = () => {};
