# 📚 MPI Library Management System

The **MPI Library Management System** is a full-featured backend solution designed for managing library operations in an educational institute. It handles borrowing, returning, fine calculation, overdue tracking, and inventory management of books in an organized and efficient way.

## 🚀 Features

- 👤 **User Roles**  
  The system defines four distinct user roles: **Student**, **Librarian**, **Admin**, and **SuperAdmin** — each with different levels of access and responsibilities within the library system.
  
- 🔐 **Authentication**  
  The system uses fully custom authentication implemented with **JWT (JSON Web Tokens)** to securely manage user sessions and protect routes based on roles.
  
- 👤 **Member Management**  
  Handle student registration requests and manage library memberships for students and staff. Keep track of members' borrowing activities efficiently.

- 📖 **Book Management**  
  Add, update, and delete book records with complete details including title, author, category, and available copies.

- ✍️ **Author Interaction**  
  Students can follow/unfollow authors. They'll receive notifications when a new book from their followed author arrives in the library.

- 📆 **Borrow Requests & Reservations**  
  Students can request to borrow books or reserve them until an expiration date if currently unavailable.

- 🎟️ **Reservation Tickets**  
  Upon successful reservation, students receive a unique ticket to verify their identity when collecting the book.

- 🔄 **Borrowing & Returns**  
  Monitor book lending activities — who borrowed what, due dates, return status, and check if borrowing limits are met.

- 💸 **Fine Calculation**  
  Automatically calculate fines for overdue, lost, or damaged books. Librarians or admins have the ability to waive fines when necessary.
  
- 🔄 **Borrow Activity History**  
  Students can view their complete borrowing history, including past borrowed books, return dates, and penalties (if any).

- ⚠️ **Student Penalty**  
  Penalties are issued for improper behavior such as canceling reservations frequently, failing to pick up reserved books, late returns, damaging or losing books, or not paying fines. These penalties may affect borrowing privileges.

- 🔔 **Notifications**  
  Notify students about due dates, reservations, fines, and other events via logs, UI messages, or email (based on the system’s integration).

- 🎧 **Support**  
  Students can reach out for help or raise queries via the support system.
  
- ⚙️ **System Configuration**  
  System behavior can be customized, including settings such as application name, system open/close status, expiration dates, and other configurable options.

- 🔧 **Other Features**  
  Includes email verification via OTP, password reset using an email link, change password functionality, and user profile updates.

- 📊 **Reports (Optional)**  
  Generate insightful reports on monthly library usage, fine collections, and book inventory status.


## 🔒 **Roles & Permissions**  
  The system supports four user roles, each with specific access levels and responsibilities:

  - **🎓 Student**
    - Submit registration requests
    - View available books and authors
    - Follow/unfollow authors
    - Request/reserve books
    - View borrow history and fines
    - Receive notifications
    - Contact support

  - **📚 Librarian**
    - Approve/reject student registration requests
    - Manage books (add, update, delete)
    - Handle borrow/return processes
    - Calculate and waive fines
    - View and manage student activities
    - Send notifications

  - **🛠️ Admin**
    - All librarian privileges
    - Manage users and roles
    - Configure system settings
    - Access reports and analytics

  - **🧭 SuperAdmin**
    - Full system access
    - Manage admins, librarians, and overall system behavior
    - Critical settings and overrides

  Permissions are strictly enforced to ensure secure and organized library operations.


## 🛠️ Tech Stack

- **Backend:** Node.js / Express *(or specify your framework)*
- **Database:** MongoDB / PostgreSQL *(or your chosen DB)*
- **Language:** JavaScript / TypeScript
- **Others:** (Optional) JWT Auth, Nodemailer, Sequelize/TypeORM, etc.



## ⚙️ Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/mpi-library-system.git
cd mpi-library-system
Install dependencies
npm install
```
2. Set up environment variables

- Create a .env file inside the backend/ folder (not the project root unless specified).
- Copy the variables from .env.local  and paste them into your .env file.
- Set appropriate values for each environment variable 





