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

## 🚀 Overview

The **Accessible Knowledge Accessing System (AKS)** is a robust, full-stack application built to democratize access to knowledge. It combines a modern interactive frontend with a highly scalable microservices backend. 

With accessibility at its core, AKS features **Text-to-Speech (Read Aloud)**, **Live Translations**, and **Interactive Concept Maps (Knowledge Graphs)** to cater to diverse learning needs.

## 🏗️ Architecture & Tech Stack

The application is built using a modern **Microservices Architecture**, ensuring high scalability, modularity, and performance.

### 🎨 Frontend (Client-Side)
- **React (Vite):** Blazing fast UI development.
- **D3.js & Mermaid:** For rendering dynamic, interactive Knowledge Graphs and Concept Maps.
- **Accessibility:** Built-in `ReadAloud` and `Translation` services.

### ⚙️ Backend (Microservices)
- **FastAPI Gateway (Python):** Central API Gateway acting as the single entry point for the frontend, routing requests to appropriate microservices.
- **Spring Boot Core Service (Java + PostgreSQL):** Handles structured, relational data such as user authentication, resource management, and administration.
- **Spring Boot Meta Service (Java + MongoDB):** Manages unstructured data, complex metadata, and document storage.
- **Node.js Reviews Service (Express + MongoDB):** A dedicated lightweight service for handling user reviews, ratings, and social interactions.

---

## 🌟 Key Features

- **🧠 Interactive Knowledge Graphs:** Visualize connections between different topics and resources using D3.js.
- **🗣️ Accessibility First:** Integrated Read-Aloud (TTS) and real-time text translation to support all users.
- **🔐 Secure Authentication:** Robust user and admin authentication flows.
- **📊 Comprehensive Dashboards:** Specialized views for regular users, librarians, and administrators.
- **🚀 Scalable Microservices:** Independent services for Core Logic, Metadata, and Reviews.

---

## 🛠️ Getting Started

Follow these steps to get the AKS platform running locally on your machine.

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.9+)
- [Java Development Kit (JDK)](https://adoptium.net/) (v17+)
- [PostgreSQL](https://www.postgresql.org/) and [MongoDB](https://www.mongodb.com/) running locally.

### 🚀 Running the Project

For Windows users, we have provided convenient batch scripts to start all services simultaneously!

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jaideep072/Sec913_project.git
   cd Sec913_project
   ```

2. **Start the Entire Stack (All 5 Services):**
   Simply double-click or run:
   ```cmd
   start.bat
   ```
   *This will launch:*
   - **Port 8001:** Spring Boot PostgreSQL Backend
   - **Port 8020:** Spring Boot MongoDB Backend
   - **Port 8002:** Node.js Reviews Backend
   - **Port 8000:** FastAPI Gateway
   - **Port 5173:** React Frontend

3. **Alternative Startup Scripts:**
   - `start_spring_boot.bat`: Starts only the Spring Boot services, the Gateway, and the Frontend.
   - `start_node_reviews.bat`: Starts only the Node.js Reviews service.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/jaideep072/Sec913_project/issues) if you want to contribute.

## 📝 License

This project is licensed under the MIT License.

---
<p align="center"><i>Crafted with ❤️ for accessible education.</i></p>
