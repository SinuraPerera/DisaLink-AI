# DisaLink AI — Disaster Triage Dashboard

Hear every village, even the silent ones. Multilingual offline-first disaster intelligence and triage layer for Sri Lanka.

## Features

- **Multilingual Report Extraction**: Processes disaster reports in Sinhala, Tamil, English, Romanized Sinhala (Singlish), and Romanized Tamil (Tanglish)
- **Real-time Triage Dashboard**: Divisional Secretariat coordinator interface for prioritizing disaster response
- **Silence Radar**: Detects silent GN areas that may need communication checks
- **Noisy-OR Confidence Scoring**: Probabilistic confidence assessment for incident verification
- **Offline-First Architecture**: PWA with local storage and IndexedDB for offline operation
- **Multi-Model Failover**: Resilient NLP engine with automatic fallback during API high-demand periods

## Prerequisites

- Node.js 18+ 
- npm or bun
- Google Gemini API key (get one from [Google AI Studio](https://aistudio.google.com/app/apikey))

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```
   The server will start on http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript type checking

## Project Structure

- `server.ts` - Express server with Gemini API integration and WebSocket support
- `src/` - React frontend application
- `public/` - Static assets
- `firestore.rules` - Firestore security rules (TDD specification)
- `security_spec.md` - Security specification document

## Security

The project implements strict security measures:
- Firestore rules with default-deny and ownership isolation
- Input validation and schema enforcement
- API key protection via environment variables
- Prompt injection resistance in NLP extraction

## License

Private project for Sri Lanka Disaster Management
