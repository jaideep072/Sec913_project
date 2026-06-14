# AKS Backend

Backend for the **Accessible Knowledge Accessing System**.

## Two run modes

You can run this stack two ways:

### A. Direct mode (default — simpler)

```
React (Vite, :5173)  ──►  Spring Boot core service (:8001)  ──►  PostgreSQL (:5432)
```

The browser talks straight to Spring. Spring's controllers all set `@CrossOrigin(origins = "*")`, so this works without any proxy. **This is the active setup** — `Frontend/.env.local` contains `VITE_API_BASE_URL=http://localhost:8001`.

### B. Through the Python gateway (optional)

```
React (Vite, :5173)  ──►  FastAPI gateway (:8000)  ──►  Spring Boot (:8001)  ──►  PostgreSQL (:5432)
```

The Python gateway proxies every call to Spring. Useful if you ever want to add a second backend service, central rate limiting, request logging, etc. To switch to this mode, edit `Frontend/.env.local`:

```
VITE_API_BASE_URL=http://localhost:8000
```

…then restart `npm run dev` and start the gateway in a third terminal (see step 2b below).

The Spring service owns the database, the business logic, and JWT auth either way.

---

## 1. PostgreSQL setup (do this once)

You need a running PostgreSQL server and a database named **`Project_AKS`**. The Spring app creates and updates all tables automatically on first run (`spring.jpa.hibernate.ddl-auto=update`), so you do **not** need to run any DDL by hand.

### a) Install PostgreSQL

Download from [postgresql.org/download](https://www.postgresql.org/download/) and install. During install:

- Remember the password you set for the `postgres` superuser.
- Default port `5432` is fine.

### b) Create the database

Open **pgAdmin** (or `psql`) and run:

```sql
CREATE DATABASE "Project_AKS";
```

> The double quotes matter — the database name has a capital letter and an underscore. Without quotes, Postgres will lowercase it and the Spring app won't find it.

### c) Match the credentials in `application.properties`

Open `coreservices_AKS/src/main/resources/application.properties` and confirm/adjust:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/Project_AKS
spring.datasource.username=postgres
spring.datasource.password=admin123
```

Change `password` to whatever you set during install. That's the only edit you usually need.

### d) That's it for SQL

Start the Spring service (see below) and Hibernate will create these tables for you:

| Table       | Created from         | Purpose                                       |
|-------------|----------------------|-----------------------------------------------|
| `users`     | `mth.models.Users`   | Registered accounts (email is unique)         |
| `sections`  | `mth.models.Section` | Catalog categories (Literature, History, …)   |
| `resources` | `mth.models.Resource`| Books/topics with rich metadata (JSON columns)|
| `borrows`   | `mth.models.Borrow`  | Staff-managed check-out records               |

On the first boot, the seeder also inserts:

- The 4 core sections: `literature`, `history`, `science`, `governance` (these are flagged `core=true` and can't be deleted from the Librarian UI)
- A handful of example resources so the Student portal isn't empty

### e) Running pgAdmin queries

To view or modify data directly, you can use the pgAdmin Query Tool:

1. Open **pgAdmin** and connect to your local server.
2. Expand **Databases** → **Project_AKS** → **Schemas** → **public** → **Tables**.
3. Right-click on a table (e.g., `users`) and select **View/Edit Data** → **All Rows**, or open the **Query Tool** (the database icon with a play button in the top toolbar).
4. In the Query Tool, you can run standard SQL commands. For example:
   ```sql
   SELECT * FROM users;
   SELECT * FROM resources;
   ```
5. Click the **Execute/Refresh** button (or press `F5`) to run the query and view the results in the Data Output panel.

---

## 2. Run the stack

In **direct mode** you need only **two terminals** (plus Postgres running as a service). The gateway terminal is needed only if you switch back to gateway mode.

### Terminal 1 — Spring Boot core service (port 8001)

```bash
cd coreservices_AKS
mvnw spring-boot:run          # Windows
# or: ./mvnw spring-boot:run  # macOS/Linux
```

Or in **Spring Tool Suite**: right-click the `coreservices` project → **Run As → Spring Boot App**.

Watch for:

```
Tomcat started on port 8001 (http)
Started CoreservicesApplication in N seconds
```

Sanity check: open <http://localhost:8001/authservice/test> → should show `Welcome I'm fine`.

Swagger UI is at <http://localhost:8001/swagger-ui.html>.

### Terminal 2b *(optional, gateway mode only)* — Python FastAPI gateway (port 8000)

Skip this terminal in direct mode. Only needed when `Frontend/.env.local` points at `:8000`.

First time only:

```bash
cd gateway
pip install -r requirements.txt
```

Then every time:

```bash
cd gateway
python run.py
```

Sanity check: <http://localhost:8000/> → `"AKS Gateway running"`.

### Terminal 2 — React frontend (port 5173)

```bash
cd ../Frontend
npm install     # first time only
npm run dev
```

Open <http://localhost:5173> and sign up. A row appears in the `users` table.

---

## 3. Architecture details

### Authentication

- `POST /authservice/signup` and `POST /authservice/signin` are public.
- All other endpoints require a `Token` header (the JWT returned by signin).
- The JWT carries the user's `email` (as `username`) and `role`. Tokens expire after 24 hours.
- A `JwtAuthFilter` runs on every request, validates the token if present, and populates a per-request `AuthContext` (ThreadLocal). Controllers call `RoleGuard.requireRole("Librarian")` etc. to enforce access.
- `GlobalErrorHandler` converts authorization failures to `401`/`403` and uniformly shapes all errors as `{ "code": …, "message": … }`.

### Role rules

| Role        | Can do                                                                   |
|-------------|--------------------------------------------------------------------------|
| Student     | Read sections + resources, list their own borrows                        |
| Librarian   | Read everything, manage sections & resources                              |
| Staff       | Read everything, manage borrows (create, mark returned, delete)           |

Roles are stored as plain strings on the `users` row: `"Student"`, `"Librarian"`, `"Staff"`. Anything else gets defaulted to `Student` on signup.

### Resource list fields

`Resource` has several list-of-string fields: `tags`, `keyThemes`, `keyFigures`, `keyFacts`, `similarTo`, `similarTopics`, `relatedTopics`. Each is stored as a single JSON-encoded TEXT column via `StringListConverter` — no join tables, no `@ElementCollection`.

---

## 4. API reference

Everything below is exposed by **both** Spring (`localhost:8001`) and the gateway (`localhost:8000`); the browser talks to the gateway. Send the JWT in a `Token` header on every protected call.

### Auth

```
POST   /authservice/signup     { fullname, phone, email, password, role? }
POST   /authservice/signin     { username, password }   → { code, jwt, role, fullname, id }
GET    /authservice/uinfo      Token header             → { id, fullname, email, phone, role }
GET    /authservice/test       (public health probe)
```

### Sections (read = any role; write = Librarian)

```
GET    /sections               → list all
POST   /sections               { name, description }     → create (id is slug of name)
PUT    /sections/{id}          { name?, description? }   → update
DELETE /sections/{id}          → cascade-deletes the section's resources
```

### Resources (read = any role; write = Librarian)

```
GET    /resources                          → all, newest first
GET    /resources?sectionId=literature     → filter by section
GET    /resources/{id}                     → single resource
POST   /resources       { sectionId, title, summary, body, author, year, pages, difficulty,
                          period, origin, keyQuote, keyFact, impact, whyRead, whyStudy,
                          tags[], keyThemes[], keyFigures[], keyFacts[],
                          similarTo[], similarTopics[], relatedTopics[] }
PUT    /resources/{id}  partial — only fields you include are updated
DELETE /resources/{id}
```

### Borrows (read = any role; Students see only their own; write = Staff)

```
GET    /borrows                      → list visible to the caller
POST   /borrows  { bookTitle, bookAuthor?, section?, resourceId?,
                   borrowerName, borrowerEmail, borrowerRole?,
                   borrowedOn?, dueDate? }              (default dueDate = borrowedOn + 14d)
PUT    /borrows/{id}/return  { returnedOn? }            (default = today)
DELETE /borrows/{id}
```

Every borrow has a derived `status` field on read: `"active"`, `"overdue"`, or `"returned"`.

### Testing APIs with Postman

You can use **Postman** (or any API client like Insomnia or cURL) to test these endpoints manually:

1. Open Postman and create a new **HTTP Request**.
2. Set the HTTP method (GET, POST, PUT, DELETE) and enter the URL (e.g., `http://localhost:8001/authservice/signup` or `http://localhost:8001/sections`).
3. For POST/PUT requests with a JSON body, go to the **Body** tab, select **raw**, and choose **JSON** from the dropdown. Enter your JSON payload.
4. **Handling Authentication:** 
   - First, send a `POST` request to `/authservice/signin` with valid credentials.
   - Copy the `jwt` token string from the JSON response body.
   - For any subsequent protected requests, go to the **Headers** tab, add a new header with the key `Token`, and paste your JWT string as the value.
5. Click **Send** to view the API response.

---

## 5. Importing into Spring Tool Suite

The whole `Backend/` folder is **not** a single Eclipse project. The Maven project lives in `Backend/coreservices_AKS/`. Import it like this:

1. **File → Import → Maven → Existing Maven Projects**
2. **Browse** to `…/Backend/coreservices_AKS` (the folder with `pom.xml`)
3. Tick the project and click **Finish**

If STS warns *"Project coreservices already exists"*, expand **Advanced** and set **Name template** to something like `[artifactId]-aks` to import alongside the old copy.

JDK requirement: **Java 25** (set in `pom.xml`). Configure it under **Window → Preferences → Java → Installed JREs** before importing.

The `Backend/gateway/` folder is a Python FastAPI service — don't import it into STS.

---

## 6. Common issues

| Problem                                                | Fix                                                                                      |
|--------------------------------------------------------|------------------------------------------------------------------------------------------|
| Spring won't connect to Postgres                       | Confirm the `Project_AKS` database exists (with quotes) and the password is correct.     |
| Frontend shows "Couldn't reach the backend"            | Spring (`:8001`) and the gateway (`:8000`) both need to be running. Check both terminals.|
| `401 Unauthorized` on `/sections`, `/resources`, etc.  | Token missing/expired. Log out and sign in again.                                        |
| `403 Forbidden` on a create/edit                       | Your role doesn't allow that action (e.g. signing up as Student then trying Librarian UI).|
| Old "menus/roles/rolesmapping" tables linger           | Safe to drop manually: `DROP TABLE menus, roles, rolesmapping;`. They're no longer used. |
| Java 25 not found                                      | `pom.xml` requires JDK 25. Install it and set `JAVA_HOME` / STS Installed JREs.          |
