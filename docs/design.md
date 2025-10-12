# Project 2 – Personal Video Game Tracker
**Authors:** Theresa Coleman, Stewart Almeida  
**Course:** CS5610 – Web Development (Fall 2025)

## 1. Project Description
A full-stack app to log, track, and review video games. Users maintain a personal library (hours, spend, status) and view community reviews.

## 2. Personas
- **Sam (Casual Gamer):** browses games, reads reviews, simple account.
- **Jesse (Avid Gamer):** tracks big library; adds/edits/deletes games; leaves reviews.
- **Aiden (Critic):** researches community ratings and popularity.

## 3. User Stories
- As Sam, I can sign up/log in, and search games by platform/genre.
- As Jesse, I can create/edit/delete games in my library and write reviews.
- As Aiden, I can open a game page and see average rating and review count.

## 4. Mockups
_Add screenshots or Figma links for: Dashboard, Game Detail, Account._

## 5. Architecture
- Frontend: HTML5 + CSS + vanilla JS modules (no frameworks)
- Backend: Node.js + Express (ESM)
- Database: MongoDB (driver only; no Mongoose)
- Hosting: Render/Railway
- Tooling: ESLint + Prettier

## 6. API (key endpoints)
- `GET /api/games`, `GET /api/games/:idOrSlug`
- `POST /api/games`, `PATCH /api/games/:id`, `DELETE /api/games/:id`
- `GET /api/games/:gameId/reviews`, `POST /api/games/:gameId/reviews`
- `PATCH /api/reviews/:id`, `DELETE /api/reviews/:id`

## 7. Future Enhancements
User-scoped libraries, cover uploads, charts for hours/spend, OAuth, theme toggle.
