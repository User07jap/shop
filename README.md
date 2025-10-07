# SHOP.CO - E-commerce Desktop App

A modern e-commerce application with a desktop app for users and sellers, and a web-based admin interface.

## Features

### Desktop App (Users & Sellers)
- **User Features:**
  - Browse and search products
  - Add items to cart
  - User authentication (register/login)
  - Order management
  - Product filtering and sorting

- **Seller Features:**
  - Seller registration and login
  - Product management (add, edit, delete)
  - View product status (pending/approved/rejected)
  - Seller dashboard

### Web Admin Interface
- Product approval/rejection system
- Admin authentication
- System statistics
- Product management

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install additional dev dependencies for desktop app:**
   ```bash
   npm install --save-dev concurrently wait-on electron-builder
   ```

## Running the Application

### Option 1: Desktop App (Recommended for Users & Sellers)

**For development:**
```bash
npm run desktop-dev
```
This will start the server and automatically launch the desktop app.

**For production:**
```bash
npm run desktop
```
This assumes the server is already running.

### Option 2: Web Interface Only

**Start the server:**
```bash
npm start
```
Then open your browser to:
- **Users/Sellers:** `http://localhost:3000/E-commerce-website-main/e-commerce%20website/public/index.html`
- **Admin:** `http://localhost:3000/E-commerce-website-main/e-commerce%20website/public/admin/index.html`

### Option 3: Development Mode

**Start with auto-reload:**
```bash
npm run dev
```

## Desktop App Features

The desktop app includes:
- **Native menu bar** with keyboard shortcuts
- **Quick navigation** between sections
- **Offline-ready** architecture
- **Professional desktop experience**

### Keyboard Shortcuts
- `Ctrl+H` (or `Cmd+H` on Mac): Home
- `Ctrl+P` (or `Cmd+P` on Mac): Products
- `Ctrl+C` (or `Cmd+C` on Mac): Cart
- `Ctrl+S` (or `Cmd+S` on Mac): Seller Dashboard
- `Ctrl+Q` (or `Cmd+Q` on Mac): Quit

## Admin Access

The admin interface is **web-based only** and accessible at:
```
http://localhost:3000/E-commerce-website-main/e-commerce%20website/public/admin/index.html
```

**Admin Registration Key:** `japhet098`

## Building for Distribution

To create distributable packages:

```bash
npm run build-desktop
```

This will create installers for Windows, macOS, and Linux in the `dist/` folder.

## Project Structure

```
├── electron-main.js          # Electron main process
├── server.js                 # Express server
├── public/                   # Frontend files
│   ├── index.html           # User homepage
│   ├── products.html        # Product catalog
│   ├── cart.html           # Shopping cart
│   ├── seller/             # Seller interface
│   └── admin/              # Admin interface (web-only)
├── data/                    # JSON data storage
└── package.json            # Dependencies and scripts
```

## Default Data

The application comes with seeded product data. Users, orders, and sellers are stored in JSON files in the `data/` directory.

## Security Notes

- Admin key is hardcoded for demo purposes (`japhet098`)
- JWT tokens expire after 7 days
- Passwords are hashed using bcrypt
- Admin interface is intentionally web-only for security

## Troubleshooting

1. **Port 3000 already in use:** Change the PORT environment variable
2. **Electron won't start:** Make sure all dependencies are installed
3. **Admin access denied:** Use the correct admin key: `japhet098`

## Support

For issues or questions, check the console output for error messages.
