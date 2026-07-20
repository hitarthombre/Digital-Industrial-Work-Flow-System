# Architecture — Digital Industrial Workflow System (DIWS)

## Overview
DIWS follows a multi-tenant SaaS architecture where each company gets an isolated workspace inside one shared platform.

## Main Layers
1. Frontend — React
2. API Layer — Node + Express
3. Database Layer — MongoDB
4. File Storage — Cloud object storage
5. AI Layer — RAG pipeline and assistant
6. Queue Layer — background jobs and scheduled tasks

## Core Principles
- Tenant isolation
- Modular codebase
- Role-based access control
- API-first design
- AI-ready data model
- Document storage separate from database

## High-Level Flow
Company Registration → Workspace Setup → Users/Roles → Master Data → Operations → Reports → AI Search

## Suggested Services
- Auth service
- Company service
- User service
- Inventory service
- Procurement service
- Production service
- Sales service
- Dispatch service
- Document service
- AI service
- Notification service
- Report service

## Future-Ready Design
The system should be built so modules like quality, maintenance, workflow builder, IoT, and AI agents can be added later without major refactoring.
