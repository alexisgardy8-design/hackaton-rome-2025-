Hackathon Rome 2025 – Crowdfunding Platform

This project was developed as part of the Rome 2025 Hackathon. It is a crowdfunding platform that connects startups wishing to launch their campaigns with investors looking to support promising projects. The goal is to offer a complete and modern solution allowing everyone to easily manage funding campaigns, from creation to follow-up.

General Overview

The platform consists of two distinct interfaces:

Campaign Creator Interface – where startups can create, customize, and manage their projects.

Investor Interface – where users can browse, view, and fund active campaigns.

The backend is built with a Node.js architecture combined with Supabase for data management and authentication.
The frontend is developed in React, following a modern, efficient, and responsive design approach.

Project Objectives

Enable the creation and management of crowdfunding campaigns.

Provide a smooth experience for investors to explore and participate in projects.

Ensure secure authentication and clear role management.

Deliver a simple, elegant, and intuitive user interface.

Project Architecture

The project is structured into three main components:

Backend – a REST API built with Node.js, Express, and Prisma, connected to a PostgreSQL database via Supabase.

Frontend Startuper – the creators’ interface for configuring and tracking campaigns.

Frontend User – the investors’ interface for discovering and funding projects.

This role-based separation allows each interface to evolve independently while maintaining a centralized and reliable core.

Technologies Used

Backend:

Node.js and Express.js for server-side logic.

Prisma for database communication.

Supabase (PostgreSQL, Auth, Storage) for full backend management.

JWT and bcrypt for authentication and user security.

Frontend:

React and TypeScript for app structure.

Vite for fast and efficient development.

Tailwind CSS for styling and layout.

React Hook Form and Zod for form handling and validation.

Framer Motion for animations and transitions.

Recharts for data visualization.

Development Tools:

GitHub Actions for continuous integration.

Vercel or Netlify for deployment.

Cursor (VS Code-based) as the main editor for its AI tool compatibility.

General Functionality

When a user logs in, they are redirected to the interface corresponding to their role (startuper or investor).

Creators can:

Enter their campaign information,

Add visuals and descriptions,

Track funds raised in real time.

Investors can:

Browse available campaigns,

View project details,

Contribute directly through the platform.

All interactions are seamlessly synchronized via Supabase, ensuring real-time data management and updates between both interfaces.
