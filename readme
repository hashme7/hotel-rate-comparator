# 🏨 Hotel Rate Comparator API

The Hotel Rate Comparator is a microservice-based backend application that compares hotel prices from multiple suppliers (Supplier A and Supplier B) and returns the best available rates. It uses Temporal workflows to orchestrate parallel calls to external APIs, deduplicates hotel data, and responds with optimized pricing.

---

## 📂 Project Structure

hotel-rate-comparator/
├── src/
│ ├── activities/
│ ├── workflows/
│ ├── routes/
│ ├── services/
│ ├── controllers/
│ └── types/
├── Dockerfile
├── .dockerignore
├── .gitignore
├── README.md
└── postman_collection.json

---

## 🚀 Live API Endpoint

**Base URL:**

http://hotel-api.hashim-dev007.online/api


**Sample Endpoint:**

GET /hotels?city=delhi


### ✅ Example
```bash
curl http://hotel-api.hashim-dev007.online/api/hotels?city=delhi
```

⚙️ Setup Instructions
1. Clone the Repository
bash
Copy
Edit
git clone https://github.com/hashme7/hotel-rate-comparator.git
cd hotel-rate-comparator
2. Install Dependencies
bash
Copy
Edit
npm install
3. Environment Configuration
Create a .env file at the root with the following:

env
Copy
Edit
PORT=4000
TEMPORAL_ADDRESS=your.temporal.cloud:7233
SUPPLIER_A_URL=https://api.supplier-a.com/hotels
SUPPLIER_B_URL=https://api.supplier-b.com/hotels
4. Start Local Server
bash
Copy
Edit
npm run dev
🐳 Docker Deployment
Build Docker Image
bash
Copy
Edit
docker build -t hotel-api .
Run Container Locally
bash
Copy
Edit
docker run -p 4000:4000 hotel-api
☁️ ECS Deployment Notes
The application is deployed on AWS ECS using Temporal Cloud.

Ensure Temporal client and worker connect to the configured TEMPORAL_ADDRESS.

📬 Postman Collection
Download or import the Postman collection from:

postman_collection.json

This includes:

GET /api/hotels?city=delhi – Fetch hotels and compare prices

✅ Submission Checklist
 ✅ Source Code

 ✅ Dockerfile

 ✅ README with Setup & Deployment Instructions

 ✅ Postman Collection

 ✅ Public API: http://hotel-api.hashim-dev007.online/api/hotels?city=delhi

🛠️ Tech Stack
Node.js

Express.js

Temporal.io (Workflow Orchestration)

Docker & ECS

Postman (for API testing)

👨‍💻 Author
Muhammed Hashim
MERN Stack Developer

