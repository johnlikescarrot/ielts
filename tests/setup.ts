import '@testing-library/jest-dom';

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
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['mock audio'], { type: 'audio/webm' }) });
    }
  }

  stop() {
    this.state = 'inactive';
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

// Polyfill URL.createObjectURL and revokeObjectURL
window.URL.createObjectURL = () => 'blob:mock-url';
window.URL.revokeObjectURL = () => {};

// Polyfill HTMLMediaElement play/pause
HTMLMediaElement.prototype.play = async () => {};
HTMLMediaElement.prototype.pause = () => {};
