# Online Date Sheet Generator

A Next.js application for generating and managing examination date sheets.

## Features

- Admin Dashboard
  - Create and manage users (admin, faculty, students)
  - Create and manage departments and batches
  - Create and manage courses
  - Create and manage examination rooms
  - Generate date sheets with automatic faculty and room allocation

- Student Dashboard
  - View date sheets by department and semester
  - Download date sheets in Excel format

## Prerequisites

- Node.js (v14 or later)
- MongoDB Atlas account
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd datesheet-generator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your MongoDB Atlas connection string:
```
MONGODB_URI=your_mongodb_atlas_connection_string
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Admin Dashboard

1. Access the admin dashboard at `/admin`
2. Create departments and batches
3. Add faculty members and students
4. Create courses and assign faculty
5. Add examination rooms
6. Generate date sheets by selecting:
   - Department and semester
   - Start and end dates
   - Excluded dates
   - Course schedule with rooms and faculty

### Student Dashboard

1. Access the student dashboard at `/student`
2. Select your department and semester
3. View your date sheet
4. Download the date sheet in Excel format

## Technologies Used

- Next.js
- MongoDB
- Mongoose
- Material-UI
- React DatePicker
- XLSX
- FileSaver

## License

This project is licensed under the MIT License.
