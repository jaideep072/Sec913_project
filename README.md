<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Architecture-Microservices-blue?style=for-the-badge" alt="Microservices" />
  <img src="https://img.shields.io/badge/Framework-React%20%7C%20Spring%20Boot%20%7C%20FastAPI%20%7C%20Node.js-purple?style=for-the-badge" alt="Stack" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</div>

<h1 align="center">Accessible Knowledge Accessing System (AKS) 📚✨</h1>

<p align="center">
  <strong>An ultra-comprehensive, highly scalable microservices platform engineered to democratize access to educational resources, interactive knowledge graphs, and library circulation services.</strong>
</p>

---

## 📖 Table of Contents
1. [Platform Overview](#-platform-overview)
2. [Exhaustive Feature Breakdown](#-exhaustive-feature-breakdown)
   - [Accessibility Suite (A11y)](#1-accessibility-suite-a11y)
   - [Interactive Visualizations](#2-interactive-visualizations)
   - [Role-Based Portals](#3-role-based-portals-and-management)
   - [Resource & Circulation System](#4-resource--circulation-system)
   - [Social & Academic Tools](#5-social--academic-tools)
3. [Microservices Architecture Deep Dive](#%EF%B8%8F-microservices-architecture-deep-dive)
4. [Data Models & Entities](#-data-models--entities)
5. [Getting Started & Installation](#-getting-started--installation)
   - [Option 1: Windows Automated Startup](#option-1-automated-startup-windows-only)
   - [Option 2: Traditional Manual Setup](#option-2-traditional-manual-startup-cross-platform)

---

## 🚀 Platform Overview

The **Accessible Knowledge Accessing System (AKS)** is a robust digital library and knowledge management system built from the ground up to ensure learning is universally accessible. Unlike traditional catalogs, AKS enriches data with deep metadata, links concepts through graph visualizations, and provides first-class accessibility tooling for every user. 

The application is powered by a **polyglot microservices architecture** that handles distinct domains using the best tool for the job: Java/PostgreSQL for transactional core logic, Java/MongoDB for complex metadata, Node.js/MongoDB for high-throughput reviews, and Python/FastAPI for a centralized API gateway.

---

## 🌟 Exhaustive Feature Breakdown

### 1. Accessibility Suite (A11y)
Breaking down barriers to education is the core philosophy of AKS. 
- **Read-Aloud (Text-to-Speech Engine):** Integrated directly into the React frontend, allowing visually impaired users, auditory learners, or multi-taskers to have resources and text blocks read aloud to them with native browser APIs.
- **Real-Time Translation:** On-the-fly multilingual translation to overcome language barriers. Users can instantly flip the interface and resource summaries into different languages.
- **Keyboard Navigation & Focus Trapping:** Carefully crafted DOM logic (`useFocusTrap.js`) ensures that screen-reader users and keyboard-only navigators can traverse modals, dropdowns, and complex layouts without losing context or getting stuck in keyboard traps.

### 2. Interactive Visualizations
- **Knowledge Graphs (D3.js):** Transforms static tags into an interactive node-link diagram. Users can visually explore how different authors, topics, and categories interconnect across the library.
- **Concept Maps (Mermaid.js):** Provides structured flowcharts for specific subjects, guiding students visually through learning paths and prerequisite knowledge.

### 3. Role-Based Portals and Management
The platform features granular access control tailored to four distinct user roles:
- **Admin Dashboard:** Total system oversight. Admins can manage all users across the system, audit access logs, configure global settings, and view system-wide analytics.
- **Librarian Dashboard:** The nerve center for cataloging. Librarians can dynamically create "Sections" (Categories), publish/unpublish resources, inject rich metadata (key facts, historical periods), and manage library inventory.
- **Staff Dashboard:** Built for day-to-day operational tracking, approving internal requests, and overseeing circulation logistics.
- **User / Student Portal:** A distraction-free, highly engaging interface for students to browse the catalog, view graph connections, read resources, and leave reviews.

### 4. Resource & Circulation System
- **Advanced Resource Cataloging:** Resources are much more than just titles and authors. The schema supports deep metadata including: *Summary, Page Count, Difficulty Level, Historical Period, Key Quotes, Impact, Key Figures, Related Topics, and Tags.*
- **Borrowing / Checkout Engine:** A complete circulation management system. Tracks `borrowerName`, `borrowedOn`, and calculates `dueDate`. Supports physical book checkouts and digital access periods.
- **Intelligent Search & Similarity:** Endpoints specifically designed to query resources by tags and recommend similar educational materials based on overlapping metadata.

### 5. Social & Academic Tools
- **Automated Citation Generator:** Automatically builds properly formatted academic citations (APA, MLA, Chicago, etc.) for any resource in the database, saving students crucial time.
- **Community Reviews & Ratings:** A dedicated system where users can leave ratings and feedback on resources, creating a community-curated quality score for educational materials.

---

## ⚙️ Microservices Architecture Deep Dive

AKS utilizes a heavily decoupled architecture to ensure maximum scalability and fault isolation. 

| Service | Port | Technology | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `8000` | Python, FastAPI | Single entry point for the frontend. Handles CORS, route forwarding, and aggregating responses from multiple microservices securely. |
| **Core Service** | `8001` | Java Spring Boot, PostgreSQL | Manages strict relational data: User Accounts, Authentication, Sections, and Circulation (Borrows). |
| **Meta Service** | `8020` | Java Spring Boot, MongoDB | Manages highly dynamic, unstructured JSON data. Handles deep Resource metadata (Tags, Related Topics, Quotes) that doesn't fit neatly into SQL rows. |
| **Reviews Service**| `8002` | Node.js, Express, MongoDB | A lightweight, event-driven service specifically dedicated to handling high-volume user reviews and ratings. |
| **Frontend UI** | `5173` | React, Vite, D3.js | The dynamic Single Page Application (SPA) providing the user interfaces and visualizations. |

---

## 🗂️ Data Models & Entities

To understand "every inch" of the system, here are the primary data schemas mapped across the microservices:

1. **User Schema (`/auth`)**
   - Fields: `fullname`, `phone`, `email`, `password`, `role` (Student, Librarian, Staff, Admin).
2. **Section Schema (`/sections`)**
   - Fields: `name`, `description`. (Used to group resources logically).
3. **Resource Schema (`/resources`)**
   - Fields: `sectionId`, `title`, `author`, `year`, `difficulty`, `period`, `origin`, `summary`, `body`.
   - Complex Metadata: `keyQuote`, `keyFact`, `impact`, `whyRead`, `whyStudy`.
   - Graph Lists: `tags`, `keyThemes`, `keyFigures`, `keyFacts`, `similarTo`, `similarTopics`, `relatedTopics`.
4. **Borrow Schema (`/borrows`)**
   - Fields: `resourceId`, `bookTitle`, `bookAuthor`, `section`, `borrowerName`, `borrowerEmail`, `borrowerRole`, `borrowedOn`, `dueDate`.

---

## 🛠️ Getting Started & Installation

### Prerequisites
Before running AKS, ensure your local development environment has:
- **Node.js** (v18+) & npm
- **Python** (v3.9+) & pip
- **Java JDK** (v17+) & Maven
- **PostgreSQL** (Running on default port 5432)
- **MongoDB** (Running on default port 27017)

---

### 🚀 Option 1: Automated Startup (Windows Only)

For Windows developers, the entire 5-tier architecture can be launched with a single click.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jaideep072/Sec913_project.git
   cd Sec913_project
   ```

2. **Start the Everything:**
   Double-click the batch file or run from the root directory:
   ```cmd
   start.bat
   ```
   *This opens 5 separate terminal windows, automatically resolving dependencies and launching the databases, the 3 backends, the gateway, and the frontend.*

---

### 🚀 Option 2: Traditional Manual Startup (Cross-Platform)

If you are on macOS/Linux, or prefer manual control to debug specific services, follow this precise sequence.

#### 1. Start the Java/Postgres Core Service (Port 8001)
```bash
cd Backend/coreservices_AKS
./mvnw clean install
./mvnw spring-boot:run
```

#### 2. Start the Java/MongoDB Meta Service (Port 8020)
*Open a new terminal window:*
```bash
cd Backend/coreservices_mongo
./mvnw clean install
./mvnw spring-boot:run
```

#### 3. Start the Node.js Reviews Service (Port 8002)
*Open a new terminal window:*
```bash
cd Backend/node_service
npm install
npm start
```

#### 4. Start the Python FastAPI Gateway (Port 8000)
*Open a new terminal window:*
```bash
cd Backend/gateway
pip install -r requirements.txt
python run.py
```

#### 5. Start the React Frontend (Port 5173)
*Open a new terminal window:*
```bash
cd Frontend
npm install
npm run dev
```

**Access the application in your browser at:** `http://localhost:5173`

---

## 🤝 Contributing & Licensing

Contributions to improve the Accessibility Knowledge Accessing System are always welcome. Please open an issue or submit a pull request via the [GitHub Repository](https://github.com/jaideep072/Sec913_project).

This project is open-source and licensed under the **MIT License**.

---
<p align="center"><i>Crafted with ❤️ for universally accessible education.</i></p>
