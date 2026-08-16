# Beyond Buttons 👔

Premium solid t-shirt e-commerce platform built with Next.js 16, featuring a beautiful storefront and comprehensive admin panel.

## ✨ Features

### Customer-Facing Website
- 🏠 **Beautiful Homepage** - Animated hero, product showcase, brand story
- 🛍️ **Shop** - Product filtering, search, sorting with smooth animations
- 🎨 **Product Pages** - Image galleries, size selection, detailed descriptions
- 🛒 **Shopping Cart** - Persistent cart with localStorage
- 💳 **Checkout** - Razorpay payment integration
- 👤 **Authentication** - Better-Auth with email/password and Google OAuth
- 📧 **Contact Form** - Email notifications via SMTP
- 🌓 **Dark/Light Mode** - Theme toggle with persistence

### Admin Panel
- 📊 **Dashboard** - Stats overview, recent orders
- 📦 **Products Management** - CRUD operations, variants, inventory
- 📂 **Categories Management** - Organize products
- 🛒 **Orders Management** - View orders, update status
- 🎟️ **Coupons Management** - Discount codes with rules
- 🖼️ **Media Library** - Upload and manage images
- 🎨 **Theme Editor** - Customize brand colors with live preview
- ⚙️ **Settings** - Brand info, contact details, social media

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB database
- (Optional) Razorpay account for payments
- (Optional) SMTP credentials for emails

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# Required
MONGODB_URI=mongodb+srv://your-connection-string
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Optional (for payments)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Optional (for emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

3. **Run development server:**
```bash
npm run dev
```

4. **Open your browser:**
- Website: [http://localhost:3000](http://localhost:3000)
- Admin Panel: [http://localhost:3000/admin](http://localhost:3000/admin)

## 🎯 Admin Panel Guide

### Accessing Admin Panel

Navigate to `/admin` to access the admin dashboard.

### Managing Products

1. Go to **Products** in the sidebar
2. Click **Add Product** button
3. Fill in product details:
   - Name, slug, description
   - Category selection
   - Pricing (base price, compare price)
   - Status (draft/active/archived)
   - Featured toggle
4. Click **Create Product**

**Tips:**
- Use descriptive names and slugs
- Add compelling descriptions
- Set compare prices for showing discounts
- Mark products as featured to highlight them

### Managing Categories

1. Go to **Categories**
2. Click **Add Category**
3. Enter name, slug, description
4. Set display order and visibility
5. Click **Create Category**

### Managing Orders

1. Go to **Orders** to view all customer orders
2. Click the status dropdown to update order status:
   - Pending → Processing → Shipped → Delivered
3. View customer details and order items

### Creating Coupons

1. Go to **Coupons**
2. Click **Add Coupon**
3. Configure:
   - **Code**: Unique coupon code (e.g., SUMMER2024)
   - **Type**: Percentage or Fixed amount
   - **Value**: Discount amount
   - **Min Order Value**: Minimum cart value required
   - **Max Discount**: Cap for percentage discounts
   - **Usage Limit**: How many times it can be used
   - **Expires At**: Expiration date
4. Toggle **Active** to enable/disable

### Media Library

1. Go to **Media**
2. Click **Upload Image** to add new images
3. Use **Copy URL** to get image URLs for products
4. Delete unused images to save space

### Theme Customization

1. Go to **Theme**
2. Adjust colors using color pickers:
   - **Primary Color**: CTAs, buttons, highlights
   - **Secondary Color**: Dark elements
   - **Accent Color**: Backgrounds, cards
   - **Background & Text**: Main content colors
3. Preview changes in real-time
4. Click **Save Theme**
5. Refresh website to see changes

### Site Settings

1. Go to **Settings**
2. Update:
   - Brand name
   - Contact email and phone
   - WhatsApp number
   - Address
   - Social media links (Instagram, Facebook, YouTube)
3. Click **Save Settings**
4. Changes reflect across entire website

## 🔄 Live Updates

When you make changes in the admin panel (products, settings, theme), the website automatically revalidates to show updates. No manual deployment needed!

## 📁 Project Structure

```
beyond-buttons/
├── app/                      # Next.js App Router
│   ├── admin/               # Admin panel pages
│   ├── api/                 # API routes
│   ├── shop/                # Shop page
│   ├── product/[slug]/      # Product detail pages
│   └── ...                  # Other pages
├── components/              # React components
│   ├── admin/              # Admin UI components
│   ├── home/               # Homepage sections
│   ├── product/            # Product components
│   └── ...
├── lib/                     # Utilities and configs
│   ├── database/           # MongoDB models
│   ├── auth/               # Authentication
│   ├── email/              # SMTP email
│   └── shop/               # Commerce logic
└── public/                  # Static assets
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4, Custom CSS
- **Database**: MongoDB with Mongoose
- **Authentication**: Better-Auth
- **Payments**: Razorpay
- **Email**: Nodemailer (SMTP)
- **Animations**: GSAP, Framer Motion
- **Icons**: Lucide React

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production

Make sure to set all required env vars in your hosting platform:
- `MONGODB_URI`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (your production URL)
- `NEXT_PUBLIC_BETTER_AUTH_URL` (your production URL)
- Razorpay keys (if using payments)
- SMTP credentials (if using emails)

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🔐 Security Notes

- Never commit `.env` file
- Use strong secrets for `BETTER_AUTH_SECRET`
- Keep Razorpay secrets secure
- Use environment variables for all sensitive data
- Enable HTTPS in production

## 🐛 Troubleshooting

**Can't connect to MongoDB?**
- Check your connection string
- Ensure IP whitelist includes your IP
- Verify database user has proper permissions

**Contact form not working?**
- Check SMTP credentials
- In development, emails print to console
- Gmail users: Use App Password, not regular password

**Theme changes not showing?**
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Check if theme API is working at `/api/admin/theme`

**Admin panel not loading?**
- Check MongoDB connection
- Verify all API routes are accessible
- Open browser console for errors

## 📄 License

MIT License - feel free to use for your projects!

## 🤝 Support

For issues or questions:
- Check existing documentation
- Review `.env.example` for required variables
- Test API routes individually
- Check browser console and server logs

---

Built with ❤️ using Next.js
