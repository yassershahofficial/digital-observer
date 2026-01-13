# Technical Architecture: The Digital Observer (Full-Stack)

## 1. Core Technology Stack

**Frontend: The Interactive Layer**

* **Next.js (App Router):** Foundational framework providing Static Site Generation (SSG) for the portfolio and On-Demand Revalidation. This keeps the 3D scene fast while allowing text/video updates to go live without a redeploy.
* **React Three Fiber (R3F):** Manages the 3D scene graph. Tapes and text are treated as reactive components that update when the backend data changes.
* **Drei:** Used specifically for `Text` (rendering admin-edited titles as 3D physical meshes). Note: YouTube videos are embedded via iframe (not useVideoTexture, which is for local video files).
* **GSAP (GreenSock):** Handles mechanical timelines (cassette sliding) and the draggable physics of the 2D resume papers.

**Styling: The Hybrid Approach**

* **Tailwind CSS:** Used for the Admin Dashboard, HUDs, and general UI layout.
* **Vanilla CSS/CSS Modules:** Used for precise "bespoke" styling of the Resume papers and the scroll-based "Curtain Lift" logic. Handles the `position: fixed` and `z-index` layering required for the parallax effects.

**Backend: Logic & Persistence**

* **Node.js (Next.js API Routes):** Manages project updates, text configuration, and view statistics.
* **MongoDB:** Stores four core collections: `projects` (cassettes), `siteConfig` (UI text), `interactionStats`, and `admins` (authorized admin accounts).
* **Mongoose:** ODM for schema enforcement.
* **NextAuth.js:** Secures the admin portal with Google OAuth.

---

## 1.1. Routing Structure

**Public Routes:**
* `/` - Home page (main portfolio with all 4 sections: Hero, VCR Station, Workbench, Workshop Floor)

**Protected Admin Routes (require Google OAuth authentication):**
* `/admin` - Admin dashboard landing/redirect page
* `/admin/content` - Simple input text fields for editing all frontend content (siteConfig)
* `/admin/projects` - CRUD interface for managing VCR cassette projects
* `/admin/analytics` - View interaction statistics and project popularity
* `/admin/admin-list` - Manage authorized admin accounts (superadmin only)

**API Routes:**
* `/api/auth/[...nextauth]` - NextAuth.js authentication handler
* `/api/site-config` - CRUD operations for siteConfig collection
* `/api/projects` - CRUD operations for projects collection
* `/api/stats` - Retrieve analytics data from interactionStats collection
* `/api/admins` - Manage admin accounts (superadmin only)
* `/api/revalidate` - Trigger on-demand revalidation after content updates

---

## 2. System Design: Content-Driven Engine

**A. UI Text & Copy Management (siteConfig)**
Every string in the user interface is fetched from MongoDB. Content editing is done via simple input text fields in `/admin/content` (not a JSON editor). All styling, positioning, and fonts are predetermined in source code and cannot be changed through the admin interface. **All content from the main page is stored in siteConfig.**

* **Hero Section:** `heroTitleLeft`, `heroTitleRight`, `heroSubtitle`, `scrollPromptText`
* **Project Section (VCR Station):** `vcrSectionTitle`, `vcrInstructionText`, `emptyTvMessage`
* **Workbench Section:** `workbenchTitle`, resume content (detailed structure below)
* **Workshop Floor Section:** `floorSectionTitle`, contact items (editable text and links only)

**Resume Content Structure (stored in siteConfig):**
* **Header:** Full name, Professional email, City, Country, LinkedIn URL, GitHub URL
* **Summary:** Text field
* **Experience:** Array of entries with Role, Company, Date From, Date To, Bullet points (array)
* **Education:** Array of entries with Degree, University, Year From, Year To, CGPA, Relevant coursework
* **Skills:** Object with categories as keys, each containing array of skill items
* **Projects:** Array of entries with Project name, What it does (description), Link
* **Achievements and Leadership:** Text field or array of entries
* **Certifications:** Array of entries with name, issuer, date, link (optional)

**Contact Items (stored in siteConfig):**
* **Polaroid:** Editable text and link
* **Envelope:** Editable text and link
* **PCB:** Editable text and link
* **Sticky Note:** Editable text and link

**B. Project & Video Management (projects)**
The dashboard provides full CRUD for the VCR tapes:

* **Fields:** `name` (cassette label), `youtubeUrl` (YouTube video URL)
* **Video Playback:** YouTube URL autoplays when cassette enters the VCR player. Video quality is capped at maximum 360p for performance. Simple iframe embedding approach.
* **Storage:** All data stored in MongoDB local database (no external file system or cloud storage)

**C. Authentication & Authorization**
* **Environment Variables:** Store API keys, secrets, private keys, and superadmin email:
  * `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
  * `NEXTAUTH_URL`, `NEXTAUTH_SECRET` - NextAuth configuration
  * `MONGODB_URI` - Database connection string
  * `SUPERADMIN_EMAIL` - Initial superadmin account (auto-created during development on first run)
* **Database (admins collection):** 
  * Fields: `email` (Google email), `role` (admin/superadmin)
  * Only superadmins can access `/admin/admin-list` to manage admin accounts
  * Superadmin from `SUPERADMIN_EMAIL` is automatically created in database on first application start

---

## 2.1. MongoDB Schema Definitions

**A. siteConfig Collection**
Stores all editable text content for the frontend. All content from the main page is stored here. Fields include:

**Section Titles & UI Text:**
* `heroTitleLeft` - Hero section left title text
* `heroTitleRight` - Hero section right title text
* `heroSubtitle` - Hero section subtitle
* `scrollPromptText` - Scroll instruction text
* `vcrSectionTitle` - VCR Station section title
* `vcrInstructionText` - Instructions for VCR interaction
* `emptyTvMessage` - Message shown when no cassette is inserted
* `workbenchTitle` - Workbench section title
* `floorSectionTitle` - Workshop Floor section title

**Resume Content:**
* `resumeHeader` - Object: `fullName`, `email`, `city`, `country`, `linkedinUrl`, `githubUrl`
* `resumeSummary` - String: Professional summary text
* `resumeExperience` - Array of objects: `{ role, company, dateFrom, dateTo, bulletPoints: [] }`
* `resumeEducation` - Array of objects: `{ degree, university, yearFrom, yearTo, cgpa, relevantCoursework }`
* `resumeSkills` - Object: `{ categoryName: [skill1, skill2, ...] }`
* `resumeProjects` - Array of objects: `{ name, description, link }`
* `resumeAchievements` - Array of strings or text field
* `resumeCertifications` - Array of objects: `{ name, issuer, date, link }`

**Contact Items:**
* `contactPolaroid` - Object: `{ text, link }`
* `contactEnvelope` - Object: `{ text, link }`
* `contactPCB` - Object: `{ text, link }`
* `contactStickyNote` - Object: `{ text, link }`

* `updatedAt` - Last modification timestamp

**B. projects Collection**
Stores VCR cassette project data:
* `name` - Cassette label/name
* `youtubeUrl` - YouTube video URL (autoplays when inserted, max 360p via iframe embedding)
* `order` - Display order in cassette stack
* `createdAt` - Creation timestamp
* `updatedAt` - Last modification timestamp
* **Note:** All data stored in MongoDB local database (no external file storage)

**C. interactionStats Collection**
Tracks user interaction events:
* `eventType` - String: `TAPE_INSERTED`, `LAUNCH_CLICKED`, `ITEM_INSPECTED`
* `timestamp` - Date of event
* `projectId` - ObjectId reference to project (for TAPE_INSERTED, LAUNCH_CLICKED)
* `itemType` - String: item type for ITEM_INSPECTED (Polaroid, Envelope, PCB, Sticky Note)
* `metadata` - Object: additional event data

**D. admins Collection**
Stores authorized admin accounts:
* `email` - Google email address (unique)
* `role` - String: `admin` or `superadmin`
* `createdAt` - Account creation timestamp
* Only superadmins can access `/admin/admin-list`

---

## 3. Layout & Scroll Mechanics (Fixed & Overlap)

The portfolio utilizes a non-traditional scroll architecture to enhance the immersive feel.

* **Section 1 (Hero) - Fixed:** The Hero section is `position: fixed` at the top of the stack. It remains stationary while Section 2 scrolls up and overlaps it, effectively hiding the eyeball as the user "enters" the workshop.
* **Middle Sections (Projects/Resume) - Sliding:** These sections exist in the normal document flow but sit at a higher `z-index`. They slide over the Hero and eventually "lift" to reveal the final section.
* **Section 4 (Contact) - Fixed Background:** The Contact section is `position: fixed` at the very bottom of the stack (`z-index: 1`).
* **The "Curtain Lift":** As the user reaches the end of the Resume section, it uses a large `margin-bottom: 100vh` to physically slide up and out of the viewport, revealing the stationary Workshop Floor underneath.

---

## 4. Section-by-Section Visual & Content Breakdown

**Section 1: The Panopticon (Hero)**

* **Visual Look:** A vast, high-contrast black void with a starry night sky background (many small shiny stars) containing a single, hyper-realistic procedural eyeball in the center. Feels like an eyeball in the night sky.
* **Color Scheme:** Dark night sky theme with twinkling stars, high contrast black background.
* **Interactive Behavior:** The eyeball follows mouse movement but remains centered in the viewport (subtle tracking effect).
* **Layout State:** Fixed. Does not scroll; gets covered by Section 2.
* **Contains:** Hero Title (left and right), Subtitle, and Scroll Prompt.
* **Perspective:** Top-down view from high above (night sky perspective).

**Section 2: The VCR Station (Projects)**

* **Visual Look:** Transition to a wooden desk with a retro TV and VCR. Feels like a workstation.
* **Color Scheme:** Warm workstation tones (wooden desk, retro equipment).
* **Layout State:** Overlapping. Slides up over Section 1.
* **Contains:** Cassette stack, Interactive TV (YouTube iframe), and Launch Button.
* **Perspective:** Medium height view (workstation level).

**Section 3: The Workbench (Resume)**

* **Visual Look:** Top-down view of the wooden desk with scattered A4 papers. Connected seamlessly to Section 2, extending the workstation.
* **Color Scheme:** Continuation of workstation theme from Section 2.
* **Layout State:** Overlapping. Connects seamlessly to Section 2.
* **Contains:** Draggable Resume papers (Profile, Experience, Skills, Education, Projects, etc.).
* **Perspective:** Same workstation level as Section 2 (extended view).

**Section 4: The Workshop Floor (Contact)**

* **Visual Look:** A high-detail concrete floor with scattered "evidence" items. Feels like looking down at the floor.
* **Color Scheme:** Concrete/floor tones, darker than sections above.
* **Layout State:** Fixed. Revealed only when Section 3 "lifts" away.
* **Contains:** Contact items (Polaroid, Envelope, PCB, Sticky Note) with editable text and links. Inspect Mode logic.
* **Perspective:** Ground-level view (floor perspective).
* **Overall Perspective Concept:** All sections represent the same person's view but at different heights - from night sky (Section 1) down to workstation (Sections 2-3) to floor (Section 4).

---

## 5. Admin Dashboard Structure

**Navigation:** Tab-based navigation system for easy access to all admin sections.

**Design & Color Scheme:** Simple white background theme for clean, minimal admin interface (contrasts with the dark, immersive main portfolio).

**A. `/admin/content` - Content Management**
* Simple input text fields for each editable text element
* Organized by sections:
  * Hero Section: Title Left, Title Right, Subtitle, Scroll Prompt
  * Project Section: Section Title, Instructions, Empty TV Message
  * Workbench Section: Section Title, Resume fields (Header, Summary, Experience, Education, Skills, Projects, Achievements, Certifications)
  * Workshop Floor Section: Section Title, Contact items (Polaroid, Envelope, PCB, Sticky Note - text and links only)
* All data stored in MongoDB (no file uploads)
* Save triggers on-demand revalidation

**B. `/admin/projects` - Project Management**
* List view of all cassette projects
* Create, edit, delete projects
* Input fields: `name` (cassette label), `youtubeUrl` (YouTube link)
* All data stored in MongoDB local database
* No video upload - only YouTube URL links

**C. `/admin/analytics` - Analytics Dashboard**
* View interaction statistics from `interactionStats` collection
* Track user behavior events:
  * `TAPE_INSERTED` - When a cassette is inserted into the VCR
  * `LAUNCH_CLICKED` - When launch button is clicked on a project
  * `ITEM_INSPECTED` - When contact items are inspected in Section 4
* Project popularity metrics (which projects get the most interactions)
* Contact item click statistics
* Simple CSV export functionality

**D. `/admin/admin-list` - Admin Management (Superadmin Only)**
* View all authorized admin accounts
* Add new admins by Google email
* Remove admin access
* Role management (admin/superadmin)

---

## 6. Component Architecture

**DynamicText.jsx**
A reusable component that bridges the database and the UI. In 3D sections, it utilizes Drei's `<Text />` to ensure your admin-edited titles are physically part of the 3D world (reacting to lighting and shadows).

**VCRStation.jsx (Section 2)**

* **TV.jsx:** Simple iframe embedding of YouTube video that autoplays when cassette is inserted. Video quality capped at 360p maximum via YouTube URL parameters.
* **Cassette.jsx:** Dynamically renders the label text (`name` field) based on the `projects` collection in MongoDB.

---

## 7. Tactile Feedback & State Responses

**A. The "VCR Clunk" (Mechanical Feedback)**

* **Insertion:** When a tape reaches the sensor zone, its movement changes from "User Drag" to a scripted GSAP "Suck-in" animation.
* **LED Status:** The VCR mesh features a small procedural LED. It glows **Orange** during the "Suck-in" phase and turns **Solid Green** only when the video buffer is ready.

**B. TV "Tracking" Static (Loading State)**

* **State: Buffering:** When a tape is inserted but the video hasn't loaded, the noise becomes "aggressive"—heavy horizontal lines and flickering "Tracking" text.

**C. Inspection Logic (Section 4)**

* **Pick-up:** Items follow a curved path to the camera with a subtle "wobble" (spring physics).

---

## 8. Analytics & Interaction Stats

**Purpose:** Track user engagement and interaction patterns to understand portfolio performance and user behavior.

**interactionStats Collection Schema:**
* `eventType` - Type of interaction: `TAPE_INSERTED`, `LAUNCH_CLICKED`, `ITEM_INSPECTED`
* `timestamp` - When the event occurred
* `projectId` - Associated project ID (for TAPE_INSERTED and LAUNCH_CLICKED events)
* `itemType` - Type of contact item (for ITEM_INSPECTED events: Polaroid, Envelope, PCB, Sticky Note)
* `metadata` - Additional event data (optional)

**Tracked Events:**
* `TAPE_INSERTED` - When a cassette is inserted into the VCR player
* `LAUNCH_CLICKED` - When the launch button is clicked to open a project
* `ITEM_INSPECTED` - When contact items are picked up/inspected in Section 4

**Analytics Features:**
* Project popularity metrics (most inserted/launched projects)
* Contact item interaction statistics
* Time-based analytics (daily/weekly/monthly trends)
* Simple CSV export functionality

---

## 9. Production & Performance

* **On-Demand Revalidation:** Saving changes in the Admin Dashboard makes updates live instantly.
* **Conditional Render:** 3D loops are paused when a section is out of view to maintain 60FPS.

---

## 10. First-Time Setup & Initialization

**Superadmin Auto-Creation:**
* On first application start, the system checks if the `SUPERADMIN_EMAIL` from environment variables exists in the `admins` collection
* If not found, automatically creates a superadmin account with the email from `SUPERADMIN_EMAIL`
* This ensures the initial superadmin can access the admin dashboard without manual database setup

**Database Initialization:**
* MongoDB collections are created automatically via Mongoose schemas on first connection
* Default `siteConfig` document should be seeded with initial text values (optional)

**Storage Architecture:**
* **All data stored in MongoDB local database** - no external file system or cloud storage
* Images, text, links, and all content stored as data in MongoDB collections
* No file uploads to filesystem - all content managed through database

