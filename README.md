# BillBuddy – Expense Sharing Backend (Splitwise-style)
A backend system for sharing expenses within groups, inspired by Splitwise.  
The backend is fully deployed and production-ready.


## Live Deployment
**Backend URL (Railway):**  
https://billbuddy-backend-production.up.railway.app

## 📦 Features
- User and Group management
- Add shared expenses within groups
- Supported split types:
  - Equal split
  - Exact amount split
  - Percentage split
- Balance tracking (who owes whom)
- Debt simplification (minimizes number of payments)
- Settlement of balances
- Fully deployed with PostgreSQL

## 🧠 Key Decisions (What Makes BillBuddy Stand Out?)
# 1.High-Level Architecture
This project has a **Clean / Hexagonal Architecture** approach, where the core business logic (expense splitting, balance computation, and debt simplification) is kept independent of external concerns such as HTTP routing and database access.

The application is structured so that:
- **Routes** handle HTTP requests
- **Controllers** contain the core business logic (splitting engines)
- **Database access** is abstracted behind a clean interface
This separation ensures the system is maintainable, testable, and scalable as requirements grow.



# 2.Unique Factors 
Instead of focusing only on basic CRUD operations, this system addresses real-world engineering challenges seen in financial applications.

### 2.1. Debt Simplification Algorithm
**Problem:**  
If User A owes User B ₹10, and User B owes User C ₹10, the system should simplify this to:  
➡ **User A owes User C ₹10**
**Solution:**  
A **greedy net-balance approach** is used to compute each user’s net position and generate the minimum number of transactions required to settle all debts.

### 2.2. Precision & the Paise Problem
In percentage-based splits (e.g., 3 people splitting ₹10.00 at 33.33% each), floating-point arithmetic leads to incorrect totals such as ₹9.99.
**Solution:**  
All monetary values are stored as **integers in paise** instead of floating-point numbers.
Remainder paise caused by percentage splits are handled deterministically by assigning the leftover amount during split calculation.


### 2.3 Atomic Transactions
Adding an expense involves multiple dependent operations:
- Creating the expense record
- Creating split records for each user
- Updating balances between users
**Solution:**  
All these operations are wrapped inside a **database transaction**.
If any step fails, the entire operation is rolled back, ensuring the system never ends up with partial or inconsistent data (no “ghost debts”).


## 3.Core Data Model
A clean and normalized database schema forms the foundation of the system.

| Table        | Key Fields |
|--------------|-----------|
| **Users**    | id, name |
| **Groups**   | id, name |
| **Expenses** | id, group_id, amount_cents, payer_id, split_type (Equal, Exact, Percentage) |
| **Splits**   | expense_id, user_id, amount_cents |
| **Balances** | from_user, to_user, amount_cents |

The `balances` table is used to track net amounts owed between users for fast lookups and simplification.

##  Why BillBuddy Stands Out?
 BillBuddy prioritizes financial accuracy and system scalability. Instead of simple floating-point math, it uses integer-based accounting (paise) to prevent rounding errors. BillBuddy also implemented a debt simplification algorithm to reduce the number of total transactions between users, and used transactional integrity to ensure that shared expenses never leave the database in an inconsistent state.


## API Endpoints 
### Users
- `POST /users` – Create a user

### Groups
- `POST /groups` – Create a group
- `POST /groups/add-user` – Add user to group

### Expenses
- `POST /expenses/equal` – Equal split
- `POST /expenses/exact` – Exact split
- `POST /expenses/percentage` – Percentage split

### Balances
- `GET /balances/user/:userId` – View balances for a user
- `GET /simplify` – Simplified balances
- `POST /settle` – Settle dues



## 🧪 Testing
All APIs were tested using **Postman**.  
Please check the attached link to Postman collection.



## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **PostgreSQL**
- **pg (node-postgres)**
- **Railway** (Deployment)



## 🌐 Deployment
The backend is deployed on **Railway** with:
- Managed PostgreSQL
- Environment-based configuration
- Production database schema