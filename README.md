<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Architecture-Microservices-blue?style=for-the-badge" alt="Microservices" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</div>

<h1 align="center">Accessible Knowledge Accessing System (AKS) 📚✨</h1>

<p align="center">
  <strong>A comprehensive, microservices-driven platform designed to make educational resources, knowledge graphs, and library services universally accessible.</strong>
</p>

---

## 🌟 Comprehensive Features

The AKS platform is heavily feature-rich, focusing on breaking down learning barriers through robust accessibility standards and powerful management tools.

### 🧩 1. Deep Accessibility Integration (A11y)
- **Text-to-Speech (Read-Aloud):** Integrated TTS system allowing visually impaired or auditory learners to easily consume textual content.
- **Real-Time Translation:** On-the-fly multi-language translation capabilities to overcome language barriers.
- **Keyboard Navigation & Focus Trapping:** Carefully crafted UI logic ensuring that screen-reader users and keyboard-only navigators can use the platform safely and effectively.

### 🧠 2. Interactive Visualizations
- **Knowledge Graphs & Concept Maps:** Powered by D3.js and Mermaid, the system dynamically generates interactive node-link diagrams that help learners visualize the relationships between complex educational topics and resources.

### 🎭 3. Role-Based Access & Dashboards
The application provides distinct portals tailored to different operational needs:
- **Admin Dashboard:** System-wide management, global analytics, and user oversight.
- **Librarian Dashboard:** Specialized tools for managing library catalogs, handling resource states, and organizing digital inventory.
- **Staff Dashboard:** Day-to-day operations and internal library tracking.
- **User Portal:** Clean, intuitive interface for end-users to browse, read, and interact with the catalog.

### 📑 4. Automated Citation Generator
- A built-in utility that automatically formats academic and structural citations for digital resources, saving students and researchers critical time.

### ⚙️ 5. Scalable Microservices Architecture
- **FastAPI Gateway (Python):** Central API Gateway acting as the single entry point for the frontend, dynamically routing requests.
- **Spring Boot Core Service (Java + PostgreSQL):** Handles structured, relational data (users, auth, primary catalogs).
- **Spring Boot Meta Service (Java + MongoDB):** Manages unstructured data and highly dynamic complex metadata.
- **Node.js Reviews Service (Express + MongoDB):** A dedicated, lightweight REST service for processing user reviews, ratings, and social engagement.

---

## 🛠️ Getting Started

Follow these steps to get the AKS platform running locally on your machine.

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.9+)
- [Java Development Kit (JDK)](https://adoptium.net/) (v17+)
- [PostgreSQL](https://www.postgresql.org/) and [MongoDB](https://www.mongodb.com/) running locally.

---

### 🚀 Option 1: Automated Startup (Windows Only)

For Windows users, we have provided convenient batch scripts to start all services simultaneously!

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jaideep072/Sec913_project.git
   cd Sec913_project
   ```

2. **Start the Entire Stack (All 5 Services):**
   Simply double-click or run from the root directory:
   ```cmd
   start.bat
   ```

---

### 🚀 Option 2: Traditional Manual Startup (Cross-Platform)

If you are on macOS/Linux, or prefer to run the services individually to monitor their specific logs, follow this sequence. *Ensure your local Postgres and MongoDB instances are running before starting.*

#### 1. Start the Spring Boot Core Service (Port 8001)
```bash
cd Backend/coreservices_AKS
./mvnw spring-boot:run
```

#### 2. Start the Spring Boot Meta Service (Port 8020)
Open a new terminal window:
```bash
cd Backend/coreservices_mongo
./mvnw spring-boot:run
```

#### 3. Start the Node.js Reviews Service (Port 8002)
Open a new terminal window:
```bash
cd Backend/node_service
npm install
npm start
```

#### 4. Start the FastAPI Gateway (Port 8000)
Open a new terminal window:
```bash
cd Backend/gateway
pip install -r requirements.txt
python run.py
```

#### 5. Start the React Frontend (Port 5173)
Open a new terminal window:
```bash
cd Frontend
npm install
npm run dev
```

The application will now be accessible at **http://localhost:5173**!

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/jaideep072/Sec913_project/issues) if you want to contribute.

## 📝 License

This project is licensed under the MIT License.

---
<p align="center"><i>Crafted with ❤️ for accessible education.</i></p>
