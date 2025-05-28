# Bitespeed Identity Reconciliation Service

This service helps identify and link customer contacts across multiple purchases by matching email addresses and phone numbers.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)


## Setup Instructions


1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Create a `.env` file in the root directory
   - Add the following configuration:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/bitespeed?schema=public"
     PORT=3000
     ```
   - Replace `username` and `password` with your PostgreSQL credentials

3. **Database Migration**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Start the Server**
     ```bash
     npm run dev
     ```
     
The service would be live on port 3000.
The sample Postman Collection used for testing has been added to the repository. Additionally, the `/identify` endpoint can be tested live at:
**`https://backend-task-thxx.onrender.com/identify`**  **(KINDLY USE ANY TEST DATA DIFFERENT FROM THE SAMPLES IN THE POSTMAN COLLECTION TO VALIDATE THE `/IDENTIFY` ENDPOINT)**
