# CulDeSale Architecture Overview

CulDeSale is built on a modern, serverless stack leveraging React for the frontend and Supabase as a Backend-as-a-Service (BaaS). This architecture ensures rapid feature development, robust security via Row Level Security (RLS), and scalable real-time capabilities.

## High-Level System Architecture

The following diagram illustrates the high-level data flow and component relationships:

```mermaid
graph TD
    %% Define Styles
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef context fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff;
    classDef supabase fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef external fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;

    %% Nodes
    Client["Web Client (Browser)"]:::frontend
    
    subgraph Frontend ["React Application (Vite)"]
        Router["React Router DOM"]:::frontend
        
        subgraph Context ["Global State"]
            AuthCtx["AuthContext"]:::context
            ThemeCtx["ThemeContext"]:::context
            RouteCtx["RouteContext"]:::context
        end
        
        subgraph Features ["Feature Modules"]
            AuthFeat["Auth & Profiles"]:::frontend
            GarageFeat["Garage Sales & Routing"]:::frontend
            MarketFeat["Marketplace Feed & Listings"]:::frontend
            ChatFeat["Real-time Messages"]:::frontend
        end
    end
    
    subgraph Backend ["Supabase BaaS"]
        GoTrue["Auth GoTrue"]:::supabase
        DB[("PostgreSQL")]:::supabase
        Storage["Object Storage"]:::supabase
        Realtime["Realtime Subscriptions"]:::supabase
    end
    
    %% External Dependencies
    MapAPI["OpenStreetMap / Leaflet"]:::external
    NavApp["Apple Maps / Google Maps App"]:::external

    %% Relationships
    Client --> Router
    Router --> Features
    Features --> Context
    
    AuthFeat <--> GoTrue
    GarageFeat <--> DB
    MarketFeat <--> DB
    ChatFeat <--> Realtime
    ChatFeat <--> DB
    MarketFeat <--> Storage
    
    GarageFeat --> MapAPI
    GarageFeat --> NavApp
    
    %% DB internal
    GoTrue -.->|Triggers| DB
```

---

## Database Schema & Relationships

The underlying PostgreSQL database hosted by Supabase uses strict relational integrity and Row Level Security.

```mermaid
erDiagram
    PROFILES ||--o{ GARAGE_SALES : hosts
    PROFILES ||--o{ LISTINGS : posts
    PROFILES ||--o{ MESSAGES : sends
    PROFILES ||--o{ FAVORITES : saves
    PROFILES ||--o{ NOTIFICATIONS : receives

    GARAGE_SALES {
        uuid id PK
        uuid seller_id FK
        text title
        text description
        date start_date
        date end_date
        time start_time
        time end_time
        float latitude
        float longitude
        int view_count
    }

    LISTINGS {
        uuid id PK
        uuid seller_id FK
        text title
        numeric price
        text status
    }

    MESSAGES {
        uuid id PK
        uuid sender_id FK
        uuid receiver_id FK
        uuid listing_id FK
        text content
        timestamp created_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        text title
        text message
        boolean read
    }
```

---

## Technical Stack Breakdown

### Frontend Layer
- **Framework:** React 18 powered by Vite for lightning-fast HMR and optimized builds.
- **Styling:** TailwindCSS used heavily for utility-first, responsive, and dark-mode compatible UI design.
- **Routing:** `react-router-dom` handles client-side routing and protected route wrappers.
- **State Management:** React Context API is used for global state (Theme, Auth, and the Route Planner).
- **Mapping:** `leaflet` and `react-leaflet` handle interactive map rendering, combined with OpenStreetMap geocoding.

### Backend Layer (Supabase)
- **Database:** PostgreSQL stores all relational data. 
- **Security:** Extensive use of PostgreSQL Row Level Security (RLS) ensures users can only edit/delete their own garage sales and listings.
- **Authentication:** Handled natively by Supabase GoTrue, injecting JWTs seamlessly into database requests.
- **Realtime:** Supabase Realtime channels are utilized for instant chat messaging and notification delivery.
- **Storage:** Supabase Storage buckets handle image uploads for marketplace listings and user avatars.

### Core Feature: Garage Sale Route Planner
The Route Planner operates primarily on the client-side to ensure maximum privacy and offline persistence:
1. **Selection:** Users add sales to `RouteContext`.
2. **Persistence:** The context syncs instantly with the browser's `localStorage`.
3. **Execution:** The `routing.js` utility evaluates the device OS and generates a bulk way-point URL utilizing native schema links (`comgooglemaps://` or `maps.apple.com`), offloading turn-by-turn navigation directly to the user's OS.
