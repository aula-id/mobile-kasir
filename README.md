# Mobile Kasir (mPOS OS)

Open-source mobile point-of-sale application built with Tauri v2, React, and TypeScript. Supports retail and F&B (food and beverage) modes with receipt printing, multi-language support, and offline-first operation.

## Features

- Retail and F&B POS modes
- Product and category management
- Cart with open item support
- Receipt generation and thermal printing
- Multi-language support (English, Indonesian, Javanese, Sundanese, Balinese)
- Open order / table management for F&B
- Transaction history
- PIN-gated access

## Tech Stack

- **Framework**: Tauri v2
- **Frontend**: React + TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v24+ recommended)
- Rust toolchain (for Tauri)
- Platform-specific Tauri dependencies ([see Tauri docs](https://v2.tauri.app/start/prerequisites/))

### Install

```bash
npm install
```

### Development

```bash
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
