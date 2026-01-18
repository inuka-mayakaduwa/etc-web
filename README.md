# Environment Setup Instructions

## 1. Create the `.env` File

Copy the `.env.example` file and create a new `.env` file.

## 2. Update the Credentials in `.env`

Replace the placeholder values with your actual credentials:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/DB_NAME?schema=public"

AUTH_SECRET="random-string-here"

NEXT_PUBLIC_API_URL="http://localhost:3000" # or production url

SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="mail@email.com"
SMTP_PASS="xxx-xxx-xxx"
SMTP_FROM="mail@email.com"
````

## 3. Run Database Migrations

```bash
pnpm prisma migrate deploy
```

## 4. Generate Prisma Client

```bash
pnpm prisma generate
```

## 5. Run the Seed Script

### Seed Command

```bash
pnpm dlx tsx .\prisma\seed.ts
```

When prompted, enter the following details:

* Super Admin Email
* Super Admin Name
* Super Admin Mobile

## 6. Build the Application

```bash
pnpm build
```

## 7. Start the Application

```bash
pnpm start
```