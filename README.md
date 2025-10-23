## 🎮 Personal Video Game Tracker

Authors: Theresa Coleman, Stewart Almeida
Course: CS5610 • Project 2

## 🧭 Objective

A full-stack web app that lets users track their video games — log hours played, money spent, and share reviews with the community.

## 🌐 Live Demo

Deployed URL: https://tcoleman01.github.io/Project-2/

Theresa's Video: https://youtu.be/pj_9FvMdd6w

Stewart's Video: https://youtu.be/JOPdEuMu4Xc

## 🖼️ Screenshot

<img src="img/Login.png" alt="Login" width="300" />
<img src="img/Sign Up.png" alt="Sign Up" width="300" />
<img src="img/Forget Password.png" alt="Forget Password" width="300" />
<img src="img/Dashboard.png" alt="Dashboard" width="300" />
<img src="img/Games.png" alt="Games" width="300" />
<img src="img/Account.png" alt="Account" width="300" />

## 🚀 Build & Run Instructions

Follow these steps to set up and run the **Personal Video Game Tracker** application locally.

---

### 🧩 1. Clone the Repository

```bash
git clone https://github.com/tcoleman01/Project-2.git
cd Project-2
```

### 📦 2. Install Dependencies

Make sure you have **Node.js (v18 or higher)** and **npm** installed.  
Then, from the project root directory, install all required dependencies:

```bash
npm install
```

### ⚙️ 3. Set Up Environment Variables

Create a new file named .env in the root directory of the project and add the following variables:

```MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/videogameTracker
```

```Application port
PORT=3000
```
⚠️ Make sure your MongoDB service is running locally or that your URI points to a valid remote database before starting the server.

### 🧩 4. Creating/Seeding the Database
To create and populate your local MongoDB with mock data, you may either manually set up the database or seed it using a provided script.

#### Manual

1. Ensure MongoDB is running locally.
2. Establish a new connection (if not already)
3. Create a database called `videogameTracker`
4. Create 4 collections called `games`, `reviews`, `user_games`, and `users`
5. For each collection, upload the respective JSON file found in the `./db/data` folder

#### Seed Script
1. Ensure MongoDB is running locally.
2. Run the seeding script:

   ```bash
   npm run seed
   ```

### 🧠 5. Start the Application

Once the environment variables are set, start the server with the following command:

```bash
npm start
```

After running the command, the application will be available at:

👉 http://localhost:3000


## ⚙️ Tech Stack

Frontend: HTML5, CSS, vanilla JavaScript (no frameworks)

Backend: Node.js, Express, MongoDB (native driver only — no Mongoose)

Auth: JWT-based authentication with secure HttpOnly cookies

Database: 2+ MongoDB collections (users, mock_games, mock_reviews, mock_user_games)

Lint/Format: ESLint + Prettier

License: MIT

## 🔐 Authentication Overview

Full user account system implemented via routes/users.js

Passwords stored using bcrypt hashing

Auth flow:

POST /register → create a new account

POST /login → sets JWT auth cookie

GET /me → fetch current user info (requires login)

POST /logout → clears session cookie

POST /change-password and PATCH /me for user updates

Protected routes enforced using middleware/auth.js

Environment variables:

MONGODB_URI=mongodb://127.0.0.1:27017/videogameTracker

MONGODB_DB=videogameTracker

PORT=3000

JWT_SECRET=dev-secret-change-this

## 🧠 Features

Create and manage a personal game list

Add community reviews and ratings

Track total hours played and spending

Authentication-protected user profiles

Large dataset support (≥1000 games)

Organized modular backend with separated routes and DB logic


