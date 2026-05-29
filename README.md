# Employee Billing & Resource Utilization System Documentation

# 1. Product Overview

## Project Name

Employee Billing & Resource Utilization System

## Project Description

The Employee Billing & Resource Utilization System is designed to help organizations manage employee allocations, monitor billability, track utilization, and forecast future resource availability.

The system provides complete visibility into:

* Employee allocations
* Billable and non-billable resources
* Project utilization
* Revenue impact


The application helps leadership teams, finance departments, and project managers make better business decisions using real-time analytics and insights.

---

# 2. Problems Solved

## 2.1 Lack of Resource Visibility

Organizations often struggle to track:

* Which employees are billable
* Which project employees are working on
* When allocations are ending
* Future employee availability

The system solves this by providing centralized allocation tracking and dashboards.

---

## 2.2 Complex Multi-Project Allocations

Employees may work on multiple projects at the same time.

The system automatically manages allocation percentages and utilization calculations.

---

## 2.3 Manual Reporting

Most organizations manually create reports using spreadsheets.

This system automates:

* Billing reports
* Utilization reports


---

# 3. Technologies Used

This project is built using the **MERN Stack Architecture** along with AI-powered analytics services.

## What is MERN Stack?

MERN Stack is a full-stack JavaScript technology stack used for building modern web applications.

| Technology | Purpose             |
| ---------- | ------------------- |
| MongoDB    | Database            |
| Express.js | Backend Framework   |
| React      | Frontend Library    |
| Node.js    | Runtime Environment |

---

## Frontend Technologies

The frontend is responsible for the user interface and dashboard experience.

### Technologies Used

* React
* TypeScript
* Vite
* Tailwind CSS

### Purpose

* Build interactive dashboards
* Manage employee and project views
* Display analytics and charts
* Provide responsive UI components

---

## Backend Technologies

The backend handles APIs, business logic, analytics, and AI processing.

### Technologies Used

* Node.js
* Express.js
* MongoDB
* Mongoose

### Purpose

* Manage REST APIs
* Handle employee and allocation data
* Process billing and utilization logic
* Generate AI insights and forecasts

---

## Database

### MongoDB

MongoDB is used as the primary database for storing:

* Employee details
* Project data
* Allocation records
* Billing information
* Analytics data

### Mongoose

Mongoose is used for:

* Schema creation
* Data validation
* Database operations

---

## AI & Analytics Technologies

The project includes AI-powered analytics and forecasting services to improve resource planning and utilization tracking.

### Technologies Used

* OpenAI API
* Ollama
* Nomic Embed Text
* RAG (Retrieval Augmented Generation)
* AI Analytics Services

---

## AI Features

The AI module provides intelligent insights and predictions such as:

* Bench prediction
* Employee allocation insights

---

## Ollama Integration

Ollama is used to run local AI models for processing employee and project data.

### Purpose

* Generate AI responses locally
* Process forecasting queries
* Support resource analytics
* Improve AI-based recommendations

---

## Nomic Embed Text

The project uses **Nomic Embed Text** for generating embeddings from employee, project, and allocation data.

### Purpose

* Convert text into vector embeddings
* Improve semantic search
* Support RAG-based AI retrieval
* Generate contextual AI insights

---

## RAG Architecture

The system uses Retrieval Augmented Generation (RAG).

### Workflow

1. Employee and project data stored in database
2. Data converted into embeddings using Nomic Embed Text
3. Embeddings processed through AI retrieval
4. Relevant information fetched
5. AI generates intelligent responses

---


## Development Tools

| Tool    | Purpose                 |
| ------- | ----------------------- |
| Git     | Version Control         |
| GitHub  | Repository Management   |
| VS Code | Development Environment |
| npm     | Package Management      |


---

# 4. Project Structure

```text
PROJECT/
│
├── backend/
├── public/
├── src/
├── package.json
└── README.md
```

## Important Folders

| Folder  | Purpose                   |
| ------- | ------------------------- |
| backend | Backend APIs and Services |
| src     | Frontend Application      |
| public  | Images and Static Files   |

---

# 5. Core Features

## 5.1 Employee Management

* Add employees
* Edit employee details
* Track employee skills
* View employee profiles

## 5.2 Resource Allocation

* Assign employees to projects
* Track FTE allocation
* Track working hours
* View utilization

## 5.3 Dashboard

* KPI cards
* Heatmaps
* Charts
* Resource summaries

## 5.4 Billing & Utilization Tracking

* Generate billing reports
* Calculate project hours
* Calculate utilization

---

# 6. FTE and Hours Logic

## Standard Rule

```text
1 FTE = 160 Hours per Month
```

## Formula

```text
Hours = FTE × 160
```
---

# 7. Installation Steps

## Clone Repository

```bash
git clone https://github.com/POURNAMI-CHANDRAN/INTERNSHIP_PROJECT.git
```

---

## Install Frontend

```bash
npm install
npm run dev
```

---

## Install Backend

```bash
cd backend
npm install
npm start
```

---

# 8. Environment Variables

Create a `.env` file:

```env
PORT=
MONGO_URI=
JWT_SECRET=
```

---

# 9. Deployment

## Recommended Platforms

| Service  | Platform      |
| -------- | ------------- |
| Frontend | Vercel        |
| Backend  | Render        |
| Database | MongoDB Atlas |

---

# 10. Common Git Commands

## Check Status

```bash
git status
```

## Add Changes

```bash
git add .
```

## Commit

```bash
git commit -m "Updated Project"
```

## Push

```bash
git push origin main
```

---

# 11. Future Improvements

* Automatic AI allocation
* Advanced forecasting
* Better analytics
* Real-time updates

---

# 12. Conclusion

INTERNSHIP_PROJECT is an workforce management platform used for:

* Resource planning
* Employee allocation
* Forecasting
* Utilization tracking
* Analytics
* Billing management

The project combines frontend, backend, database, and AI services into a single scalable system.
