# DisaLink AI

<p align="center">
  <img src="logo.png" width="120" alt="DisaLink AI Logo">
</p>

### Offline-First, Trilingual Disaster Intelligence & Triage Platform for Sri Lanka

> **Hear every village, even the silent ones.**

DisaLink AI is an **offline-first, trilingual disaster triage and decision-support platform** designed for **Divisional Secretariat (DS) Relief Coordinators across Sri Lanka**.

During floods, landslides, monsoons, and other disasters, critical information often arrives through fragmented **WhatsApp messages, SMS, voice reports, and field updates**. These reports may be written in Sinhala, Tamil, English, Singlish, or Tanglish, making rapid verification and prioritisation difficult.

DisaLink AI transforms these fragmented reports into **structured incident intelligence**, helping relief coordinators understand **what is happening, where it is happening, how severe it may be, and what requires attention first**.

---

## 🚨 The Problem

Sri Lanka's disaster response environment can generate thousands of fragmented reports during a major emergency.

Information may arrive as:

- WhatsApp forwards
- SMS messages
- Voice reports
- Sinhala text
- Tamil text
- English text
- Singlish
- Tanglish
- Duplicate reports from different sources
- Reports with incomplete locations
- Areas that produce little or no information

This creates several critical challenges:

### Information Fragmentation

Important information is distributed across multiple communication channels instead of appearing as structured incidents.

### Language Barriers

Reports can contain multiple languages and Romanised forms of Sinhala and Tamil.

### Duplicate Information

Several people may report the same incident independently, making it difficult to determine whether reports refer to the same event.

### Information Overload

During a disaster, coordinators need to identify the most urgent incidents quickly.

### The Silence Problem

An area producing no reports is not necessarily safe.

It may indicate:

> **No incident — or no communication.**

DisaLink AI treats this silence as a signal that may require verification.

---

# 💡 The DisaLink AI Solution

DisaLink AI acts as an **intelligence layer between raw disaster reports and human decision-makers**.

```text
WhatsApp / SMS / Voice / Field Reports
                  │
                  ▼
        ┌───────────────────┐
        │  AI Report Parser  │
        └─────────┬─────────┘
                  │
                  ▼
       Structured Incident Data
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 Noisy-OR Confidence   Silence Radar
        │                   │
        └─────────┬─────────┘
                  ▼
          Triage Intelligence
                  │
                  ▼
        DS Relief Coordinator
                  │
                  ▼
       Faster Human Decisions
```

The platform does **not replace human decision-makers**.

Instead, it provides coordinators with structured intelligence, confidence indicators, prioritisation support, and an auditable decision trail.

---

# ✨ Core Features

## 🌐 Trilingual & Multilingual Intelligence

DisaLink AI is designed to understand disaster reports across:

- 🇬🇧 English
- 🇱🇰 සිංහල
- 🇮🇳 தமிழ்
- Singlish
- Tanglish

The system transforms unstructured reports into structured incident information.

Example:

```text
"Api gawa thiyena gama watura walin yata wela.
Gedara 20k wage affected."

            ↓

Structured Incident

Location: Identified GN Division
Incident: Flooding
Affected Houses: ~20
Language: Singlish
Urgency: High
Confidence: Calculated
```

---

# 🧠 AI-Powered Report Extraction

The AI extraction layer identifies important information from incoming reports, including:

- Incident type
- Location
- Affected population
- Infrastructure impact
- Urgency
- Report summary
- Relevant entities
- Confidence indicators

This allows coordinators to work with structured information rather than manually interpreting hundreds of messages.

---

# 🔗 Noisy-OR Confidence Scoring

DisaLink AI uses **Noisy-OR probability aggregation** to combine evidence from multiple independent reports.

Instead of treating every report as an isolated event, the system can increase confidence when multiple reports support the same incident.

Conceptually:

```text
Report 1 ── 60% confidence ──┐
                             │
Report 2 ── 70% confidence ──┼──► Combined Confidence
                             │
Report 3 ── 50% confidence ──┘
```

The approach helps distinguish between:

- Single unverified reports
- Multiple corroborating reports
- High-confidence incidents
- Conflicting or uncertain information

---

# 📡 Silence Radar

One of DisaLink AI's key concepts is the **Silence Radar**.

Traditional disaster dashboards primarily show where reports exist.

DisaLink AI also asks:

> **Where should we be hearing from, but aren't?**

The system identifies GN divisions that have unusually low reporting activity and highlights them for communication checks.

This can help coordinators investigate situations where:

- Communication infrastructure may be unavailable
- Communities may be isolated
- Mobile connectivity may be disrupted
- People may be unable to report incidents
- A disaster may be developing without sufficient incoming information

### Important principle

```text
No Reports ≠ No Disaster
```

Silence becomes another form of intelligence.

---

# 🚦 Real-Time Disaster Triage

The dashboard provides a central operational view for DS Relief Coordinators.

Coordinators can identify:

- Critical incidents
- High-priority incidents
- Emerging incidents
- Unverified reports
- Silent GN divisions
- Incident locations
- Confidence levels
- Response status

The goal is to reduce the time between:

```text
Report → Understanding → Prioritisation → Human Action
```

---

# 📴 Offline-First Architecture

Disaster environments cannot always guarantee stable internet connectivity.

DisaLink AI therefore follows an **offline-first Progressive Web App (PWA)** approach.

The application uses local browser storage and IndexedDB to support continued operation when connectivity is unavailable.

```text
              INTERNET AVAILABLE
                      │
                      ▼
              Cloud Synchronisation
                      │
                      ▼
              DisaLink AI Dashboard
                      ▲
                      │
              Local Data Layer
                      │
              ┌───────┴───────┐
              │    Offline    │
              │    Operation  │
              └───────────────┘
```

This architecture is particularly important for:

- Flood-affected regions
- Landslide areas
- Rural communities
- Connectivity-disrupted locations
- Emergency field operations

---

# 🔄 Multi-Model AI Failover

Disaster response systems should not depend on a single AI request succeeding every time.

DisaLink AI includes a resilient AI architecture with **model/API fallback mechanisms** to improve availability during:

- API rate limits
- Temporary provider failures
- High-demand periods
- Network instability

The objective is to keep the intelligence layer operational whenever possible.

---

# 🔐 Security & Trust

Disaster intelligence can contain sensitive operational information.

DisaLink AI therefore incorporates security controls around data access and validation.

The project includes Firestore security rules based on:

- Default-deny access
- Authenticated coordinator identity
- Ownership isolation
- Strict schema validation
- Input validation
- Immutable fields
- Timestamp integrity
- Terminal-state protection

The security specification also defines adversarial test cases for scenarios such as:

- Unauthenticated writes
- Identity spoofing
- Unauthorized fields
- Invalid IDs
- Oversized payloads
- Invalid urgency values
- Forged timestamps
- Cross-user data access
- Immutable field manipulation
- Archived-record modification

---

# 🧾 Auditable AI Decisions

AI-assisted disaster response should not become a black box.

DisaLink AI is designed around the principle:

> **AI recommends. Humans decide.**

AI-generated decisions and coordinator overrides can be tracked to support accountability and operational review.

The system uses cryptographic hashing concepts, including **SHA-256**, for decision/override logging.

This creates a stronger foundation for:

- Accountability
- Post-disaster analysis
- Decision review
- Auditability
- Human oversight

---

# 🗺️ Geospatial Intelligence

DisaLink AI includes map-based interfaces for understanding incidents geographically.

The system uses **Leaflet** for interactive mapping.

This allows disaster coordinators to understand:

- Incident locations
- Geographic concentration
- Affected areas
- Silent regions
- Spatial relationships between incidents

---

# 📊 Dashboard Intelligence

The platform brings together multiple information layers into a unified operational dashboard.

### Incident Intelligence

```text
Incident
├── Location
├── Incident Type
├── Severity
├── Confidence
├── Affected Population
├── Evidence
└── Status
```

### Area Intelligence

```text
GN Division
├── Active Incidents
├── Report Frequency
├── Confidence
├── Silence Indicator
└── Communication Status
```

### Coordinator Intelligence

```text
Coordinator
├── Assigned Area
├── Active Cases
├── Priority Incidents
├── Decisions
└── Overrides
```

---

# 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────┐
│                 DisaLink AI PWA                   │
│                                                    │
│  React UI │ Dashboard │ Maps │ Charts │ Offline   │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│              Application / API Layer               │
│                                                    │
│        Express Server + WebSocket Support         │
└───────────────────────┬────────────────────────────┘
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
┌─────────────────────┐   ┌────────────────────────┐
│   AI Intelligence   │   │   Firebase / Firestore │
│                     │   │                        │
│ Google Gemini       │   │ Authentication         │
│ Report Extraction   │   │ Coordinator Records    │
│ NLP Processing      │   │ Security Rules         │
│ Failover            │   │ Data Persistence       │
└─────────────────────┘   └────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────┐
│                 Local Data Layer                   │
│                                                    │
│              IndexedDB / PWA Storage               │
└────────────────────────────────────────────────────┘
```

---

# 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Backend | Node.js + Express |
| AI | Google Gemini API |
| Database | Firebase Firestore |
| Authentication | Firebase |
| Offline Storage | IndexedDB |
| PWA | Vite PWA |
| Mapping | Leaflet |
| Charts | Recharts |
| Icons | Lucide React |
| Animation | Motion |
| Real-Time Communication | WebSocket |
| Styling | Tailwind CSS |
| Environment Management | dotenv |

The current repository package configuration confirms the React/Vite/Express/Firebase/Gemini/IndexedDB/Leaflet/WebSocket stack.

---

# 📁 Project Structure

```text
DisaLink-AI/
│
├── public/
│   └── Static assets
│
├── src/
│   ├── Components
│   ├── Pages
│   ├── Services
│   ├── Hooks
│   └── Application logic
│
├── .env.example
├── .gitignore
│
├── server.ts
│
├── firestore.rules
├── firestore.rules.test.ts
│
├── security_spec.md
│
├── firebase-applet-config.json
├── firebase-blueprint.json
│
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Before running DisaLink AI locally, install:

- **Node.js 18+**
- **npm** or **Bun**
- A **Google Gemini API key**
- A Firebase project for production data/authentication features

---

## 1. Clone the Repository

```bash
git clone https://github.com/SinuraPerera/DisaLink-AI.git

cd DisaLink-AI
```

---

## 2. Install Dependencies

Using npm:

```bash
npm install
```

Or using Bun:

```bash
bun install
```

---

## 3. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Then configure your Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

> Never commit your `.env` file or expose API keys in frontend code.

---

# ▶️ Running the Application

## Development

```bash
npm run dev
```

The development server runs on:

```text
http://localhost:3000
```

---

## Production Build

```bash
npm run build
```

---

## Start Production Server

```bash
npm run start
```

---

## Preview Production Build

```bash
npm run preview
```

---

## Type Checking

```bash
npm run lint
```

---

# 🔑 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

Additional Firebase configuration may be required depending on the deployment environment and enabled features.

---

# 🧪 Security Testing

DisaLink AI includes Firestore security rule testing and a dedicated security specification.

The security model follows a **default-deny** approach and restricts coordinator records to their authenticated owners.

Example security principles:

```text
Unauthenticated Request
        │
        ▼
       DENY
```

```text
Authenticated User
        │
        ▼
Is user the owner?
   │            │
  YES           NO
   │            │
 ALLOW         DENY
```

The project also defines adversarial payload scenarios covering identity spoofing, field injection, invalid urgency values, forged timestamps, cross-user access, and archived-record modification.

---

# 🧠 Key Intelligence Concepts

DisaLink AI is built around several important concepts.

### 1. Multilingual Information Extraction

Converts unstructured multilingual reports into structured incident data.

### 2. Evidence Aggregation

Combines multiple reports to improve incident confidence.

### 3. Silence Detection

Identifies areas where a lack of reports may itself require investigation.

### 4. Human-in-the-Loop Decision Making

AI assists coordinators rather than autonomously making life-critical decisions.

### 5. Offline Resilience

Maintains useful functionality when network connectivity is unreliable.

### 6. Explainability & Auditability

Provides confidence and decision information rather than treating AI outputs as unquestionable truth.

---

# 🇱🇰 Designed for Sri Lanka

DisaLink AI is designed around the realities of Sri Lankan disaster response.

The system considers:

- 25 administrative districts
- Divisional Secretariat operations
- GN divisions
- Sinhala-speaking communities
- Tamil-speaking communities
- English communication
- Singlish and Tanglish reports
- Monsoon-related flooding
- Landslides
- Rural connectivity challenges
- Fragmented communication channels

The goal is not simply to build another disaster dashboard.

The goal is to build a system that understands the **information environment in which Sri Lankan disaster coordinators actually operate**.

---

# 🎯 Target Users

### Primary Users

**Divisional Secretariat Relief Coordinators**

### Potential Secondary Users

- Disaster Management Centre personnel
- District-level administrators
- Emergency response teams
- Local government authorities
- Humanitarian organisations
- Field officers
- Relief coordination teams

---

# 🔮 Future Roadmap

Potential future development includes:

- [ ] Full voice-to-incident pipeline
- [ ] Advanced Sinhala NLP
- [ ] Advanced Tamil NLP
- [ ] Automated WhatsApp ingestion
- [ ] SMS gateway integration
- [ ] Satellite/weather data integration
- [ ] Flood-risk prediction
- [ ] Landslide-risk prediction
- [ ] Automated resource allocation
- [ ] Relief vehicle routing
- [ ] Shelter capacity monitoring
- [ ] Public emergency reporting interface
- [ ] Advanced analytics
- [ ] District-level command centre integration
- [ ] Improved AI explainability
- [ ] More comprehensive offline synchronisation
- [ ] Disaster-response API
- [ ] Mobile field application

---

# ⚠️ Responsible AI & Safety

DisaLink AI is intended as a **decision-support system**, not an autonomous emergency-response authority.

AI-generated information may contain errors.

Therefore:

> **Critical decisions must remain under qualified human supervision.**

The platform should be used to support:

- Information organisation
- Incident verification
- Prioritisation
- Situational awareness
- Communication checks
- Decision documentation

It should not independently determine life-critical actions without appropriate human validation.

---

# 🤝 Contributing

Contributions, ideas, testing, and feedback are welcome.

If you would like to contribute:

```bash
git clone https://github.com/SinuraPerera/DisaLink-AI.git
cd DisaLink-AI
npm install
```

Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

Make your changes, test them, and submit a pull request.

---

# 🔒 Security

If you discover a security vulnerability, please do not publicly disclose sensitive details through a GitHub issue.

Instead, contact the project maintainer privately with:

- Description of the vulnerability
- Reproduction steps
- Potential impact
- Suggested mitigation

---

# 📜 License

This repository currently describes DisaLink AI as a **private project for Sri Lanka Disaster Management**.

See the repository's licensing information before redistributing or deploying the project.

---

# 👨‍💻 Project

**DisaLink AI**

Built by:
**Sinura Perera**
**Dulnith Bandara** with 💪 for **Intellicon'26**

**Repository:**  
https://github.com/SinuraPerera/DisaLink-AI

---

## 🇱🇰 Hear Every Village. Even the Silent Ones.

**DisaLink AI**

> Turning fragmented disaster reports into structured intelligence — so the right people can make better decisions, faster.
