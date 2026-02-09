# Technical Documentation: Time Tracker

## 1. Overview

This document provides a technical overview of the Time Tracker application. It is a full-stack web application designed for users and teams to track their time spent on various tasks. It includes features for user authentication, time entry management, reporting, and team administration.

The application is built using a modern technology stack centered around Next.js and TypeScript, providing a robust, type-safe, and performant user experience.

## 2. Tech Stack

The project leverages a range of modern technologies:

*   **Framework**: [Next.js](https://nextjs.org/) (v15+) - A React framework for building full-stack web applications. The App Router is used for routing and layouts.
*   **Language**: [TypeScript](https://www.typescriptlang.org/) - For static typing and improved developer experience.
*   **UI Library**: [shadcn/ui](https://ui.shadcn.com/) - A collection of reusable UI components built on Radix UI and Tailwind CSS.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
*   **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) - A NoSQL database and an Object Data Modeling (ODM) library for Node.js.
*   **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/) for session management and `bcryptjs` for password hashing.
*   **Form Management**: [React Hook Form](https://react-hook-form.com/) for building forms, coupled with [Zod](https://zod.dev/) for schema validation.
*   **Data Visualization**: [Recharts](https://recharts.org/) - A composable charting library for React.
*   **Icons**: [Lucide React](https://lucide.dev/) - A library of simply designed, beautiful icons.
*   **Date/Time**: [date-fns](https://date-fns.org/) - For reliable and consistent date manipulation.
*   **Data Export**: [xlsx](https://sheetjs.com/) - For generating and parsing spreadsheet files (e.g., Excel).

## 3. Project Structure

The project follows a structure conventional for Next.js (App Router) applications.

```
/
├── app/                  # Core application, uses App Router
│   ├── (authenticated)/  # Route group for pages requiring login
│   ├── api/              # Backend API routes (serverless functions)
│   ├── layout.tsx        # Root application layout
│   └── page.tsx          # Main entry page (login/landing)
│
├── components/           # Reusable React components
│   └── ui/               # Low-level UI components from shadcn/ui
│
├── lib/                  # Shared utilities, hooks, and core logic
│   ├── models/           # Mongoose data models (User, TimeEntry)
│   ├── auth.ts           # Authentication logic (JWT, sessions)
│   ├── mongodb.ts        # MongoDB connection management
│   ├── permissions.ts    # User permission and role logic
│   └── utils.ts          # General utility functions
│
├── public/               # Static assets (images, fonts)
└── package.json          # Project dependencies and scripts
```

## 4. Core Concepts

### 4.1. Authentication and Authorization

*   **Route Protection**: The `app/(authenticated)/` directory is a [Route Group](https://nextjs.org/docs/app/building-your-application/routing/route-groups). It protects all nested routes, ensuring only authenticated users can access them. A check is performed in the layout file `app/(authenticated)/layout.tsx`.
*   **Session Management**: User authentication is handled via JWT. When a user logs in (`/api/auth/login`), a token is generated and stored on the client. This token is sent with subsequent API requests to verify the user's session.
*   **Password Security**: User passwords are not stored in plaintext. They are hashed using `bcryptjs` before being saved to the database.

### 4.2. API Routes and Data Handling

*   The backend is a set of serverless functions located in the `app/api/` directory. Each sub-directory corresponds to a RESTful endpoint.
*   For example, a `GET` request to `/api/time-entries` will trigger the logic in `app/api/time-entries/route.ts` to fetch time entries from the database.
*   API routes handle all communication with the database, ensuring that client-side code does not have direct access to the database credentials or logic.

### 4.3. Database Interaction

*   The application connects to a MongoDB database using the official `mongodb` driver.
*   The `lib/mongodb.ts` file manages a cached, reusable database connection, which is crucial for performance in a serverless environment.
*   **Mongoose Models** in `lib/models/` (e.g., `User.ts`, `TimeEntry.ts`) define the schema and structure for the data stored in MongoDB, providing validation and business logic hooks.

### 4.4. UI and Component Architecture

*   The UI is built on a foundation of **shadcn/ui** components, which are located in `components/ui/`. These are primitive components like `Button`, `Card`, and `Input`.
*   More complex, application-specific components (e.g., `TimeTable`, `Sidebar`) are located directly in `components/` and are composed from these UI primitives.
*   This architecture promotes consistency and reusability, allowing for rapid development of new features while maintaining a cohesive design.

## 5. Getting Started

To set up and run the project locally, follow these steps.

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env.local` file in the project root and add the necessary environment variables, such as the MongoDB connection string and a secret key for JWT.
    ```
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_key
    ```

3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

4.  **Build for Production**:
    To create a production-ready build, run:
    ```bash
    npm run build
    ```
