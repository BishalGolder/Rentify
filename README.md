# 🏠 Rentify — Property Rental Marketplace

**Section:** 10  
**Group:** Group 2  

Rentify is a full-stack real estate and rental property marketplace designed to make finding, saving, and reviewing rental properties seamless and intuitive. Built with **React (Vite)**, **Express.js**, and **PostgreSQL (Supabase)**, it features real-time search, multi-parameter filtering, dynamic sorting, user wishlists, and persistent viewing history.

---

## 👥 Team Members

| Student ID | Name |
| :--- | :--- |
| **23201378** | Bishal Golder |
| **21301573** | Md. Jubair Hossain |
| **23301327** | Mir Abdul Akif |
| **22201010** | Sumaya Akter Kashpia |

---

# 📖 Project Description

Finding rental housing should be simple, fast, and reliable. However, many rental platforms provide limited search functionality, poor navigation, and lack personalized features.

**Rentify** addresses these challenges by offering a modern and responsive rental marketplace where users can:

- 🔍 Search properties instantly by keywords.
- 📍 Filter properties by district, location, property type, bedrooms, bathrooms, guest capacity, and ratings.
- ❤️ Save favorite properties to a personal wishlist.
- 🕒 View recently visited properties through an automatically maintained browsing history.
- 📊 Sort listings by price or rating for better decision-making.

The application is built with a RESTful backend using Express.js and PostgreSQL, while React + Vite provides a fast, responsive frontend experience.

---

# ✨ Features

## 🏡 Property Marketplace

- Browse all available rental properties
- View detailed property information
- Responsive property cards
- Property ratings and pricing
- Property type categorization

## 🔍 Smart Search & Filtering

- Live debounced search
- Search by:
  - Property title
  - Location
  - District
  - Property type
- Filter by:
  - Minimum bedrooms
  - Minimum bathrooms
  - Maximum guests
  - Rating
- Multiple filters can be combined

---

## 📊 Smart Sorting

Sort listings by:

- Price (Low → High)
- Price (High → Low)
- Highest Rated

Implemented using SQL `ORDER BY` queries for maximum efficiency.

---

## ❤️ Wishlist

Users can:

- Add properties to wishlist
- Remove properties instantly
- View all saved properties
- Persistent storage in PostgreSQL

---

## 🕒 Recently Viewed

Every visited property is automatically recorded.

Features include:

- Tracks viewing history
- Stores only one record per user-property pair
- Updates timestamp using PostgreSQL `ON CONFLICT`
- Displays the latest 5 viewed properties

---

## 👤 User Dashboard

The profile page displays:

- User information
- Wishlist
- Recently viewed properties

Everything updates dynamically from the backend.

---

# 🛠 Tech Stack

## Frontend

- React 18
- Vite
- React Router DOM v6
- CSS3
- Fetch API

---

## Backend

- Node.js
- Express.js
- pg (node-postgres)

---

## Database

- PostgreSQL
- Supabase

### SQL Features Used

- WHERE filters
- ORDER BY
- DISTINCT ON
- JOIN
- ON CONFLICT
- Foreign Keys
- Indexed searches

---

# 📂 Project Structure

```
Rentify/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── db/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── README.md
└── .gitignore
```

---

# 🚀 Getting Started

## Prerequisites

Before running the project, install:

- Node.js (v18 or later)
- npm
- PostgreSQL database or Supabase project

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/BishalGolder/rentify.git
cd rentify
```

---

## 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend directory.

```env
DATABASE_URL=your_postgresql_connection_string
PORT=5000
```

Start the backend server:

```bash
node server.js
```

Backend runs at:

```
http://localhost:5000
```

---

## 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

# 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/properties/search` | Search, filter and sort properties |
| GET | `/api/properties/:id` | Fetch single property details |
| GET | `/api/wishlist/:userId` | Get wishlist items |
| POST | `/api/wishlist/toggle` | Add/Remove wishlist property |
| GET | `/api/wishlist/recent/:userId` | Get recently viewed properties |
| POST | `/api/wishlist/recent` | Save/update recently viewed property |

---


# 📄 License

This project was developed as an academic course project.

---
