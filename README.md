<<<<<<< HEAD
# CampusMart - Student Marketplace Platform

🎓 A modern, OLX-style marketplace platform designed specifically for students to buy and sell items within their campus community.

## ✨ Features

### 🛒 **Student Marketplace**
- **OLX-Style Layout**: Single-column feed with detailed item cards
- **Infinite Scroll**: Load more items seamlessly
- **Item Management**: Edit and delete your posted items
- **Image Upload**: Multiple image support for each listing
- **Search & Filter**: Find items by category, condition, and location
- **Interest System**: Show interest in items and contact sellers

### 👨‍💼 **Admin Dashboard**
- **Pending Approvals**: Review and approve/reject student listings
- **User Management**: Monitor student accounts and activities
- **Analytics**: Track marketplace usage and statistics

### 🎨 **Modern UI/UX**
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works perfectly on mobile and desktop
- **Smooth Animations**: Professional hover effects and transitions
- **Form Validation**: Real-time validation with clear error messages

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd CampusMart
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the `backend` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/campusmart
   JWT_SECRET=your_jwt_secret_key_here
   PORT=3001
   ```

5. **Start the Application**
   
   **Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   
   **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 📁 Project Structure

```
CampusMart/
├── backend/                 # Node.js + Express API
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth & upload middleware
│   ├── uploads/            # User uploaded images
│   └── server.js           # Main server file
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Main application pages
│   │   └── services/       # API services
│   └── public/             # Static assets
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Material-UI** - Component library
- **Axios** - HTTP client
- **React Router** - Navigation
- **Context API** - State management

## 🎯 Key Features Implemented

### 📱 **Marketplace Features**
- ✅ OLX-style single-column layout
- ✅ Infinite scroll pagination
- ✅ Item CRUD operations (Create, Read, Update, Delete)
- ✅ Image upload with preview
- ✅ Category and condition filtering
- ✅ Interest system for buyers
- ✅ Responsive design for all devices

### 🎨 **UI/UX Enhancements**
- ✅ Dark/Light theme toggle
- ✅ Smooth animations and hover effects
- ✅ Professional form styling with validation
- ✅ Organized form sections with visual hierarchy
- ✅ Loading states and error handling

### 🔐 **Security & Authentication**
- ✅ JWT-based authentication
- ✅ Protected routes and middleware
- ✅ Admin role-based access control
- ✅ Secure file upload handling

## 🚀 Deployment

### Environment Variables
Make sure to set these environment variables for production:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
PORT=3001
NODE_ENV=production
```

### Build for Production

```bash
# Build frontend
cd frontend
npm run build

# The built files will be in frontend/dist/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Marketplace
- `GET /api/marketplace` - Get all approved items
- `POST /api/marketplace` - Create new item
- `PUT /api/marketplace/:id` - Update item
- `DELETE /api/marketplace/:id` - Delete item
- `POST /api/marketplace/:id/interest` - Show interest in item

### Admin
- `GET /api/admin/pending` - Get pending items
- `PUT /api/admin/approve/:id` - Approve item
- `PUT /api/admin/reject/:id` - Reject item

## 🎓 For Students

This platform is designed to help students:
- 📚 Sell textbooks and study materials
- 💻 Trade electronics and gadgets
- 👕 Exchange clothing and accessories
- 🏠 Find furniture and room essentials
- 🎮 Share gaming equipment and entertainment items

## 📞 Support

If you encounter any issues or have questions:
1. Check the existing issues in the repository
2. Create a new issue with detailed description
3. Include screenshots if applicable

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ for the student community**

Enjoy trading with your fellow students! 🎉
=======
# CampusMart
BEE project
>>>>>>> e98225b5fc7e9c9d6967d9832b82f7ab7763eadd
