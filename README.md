# 🍽️ Guestara – Menu & Services Management Backend

A real-world backend system for managing restaurant menus, services, bookings and dynamic pricing.
This project focuses on **business logic design, data modeling, pricing engines and inheritance rules**, not just CRUD APIs.

## 🚀 Features

- ✅ **Category, Subcategory & Item Management**
- ✅ **Tax Inheritance Engine** (Item → Subcategory → Category)
- ✅ **Soft Deletes** (is_active based)
- ✅ **Advanced Pricing Engine** (5 pricing types)
- ✅ **Availability & Booking System**
- ✅ **Add-ons with Pricing Impact**
- ✅ **Search, Filter, Pagination & Sorting**
- ✅ **Booking Conflict Prevention**
- ✅ **Real-time Dynamic Price Calculation API**

## 🧱 Architecture

```
src/
 ├── config/         # Database & constants configuration
 ├── controllers/    # HTTP request handlers
 ├── services/       # Business logic layer
 ├── routes/         # API route definitions
 ├── models/         # MongoDB schemas
 ├── validations/    # Joi validation schemas
 ├── utils/          # Pricing & tax engines
 └── app.js          # Application entry point
```

### Why this structure?

- **Controllers** handle HTTP only
- **Services** contain all business logic
- **Models** define schemas
- **Utils** handle pricing & tax engines

This separation keeps code **clean, testable and maintainable**.

## 🗄️ Data Modeling

### Category
| Field | Description |
|-------|-------------|
| name | Unique per restaurant |
| tax_applicable | Boolean |
| tax_percentage | Required if tax_applicable true |
| is_active | Soft delete flag |

### Subcategory
- Belongs to a category
- Inherits tax from category if not defined

### Item
- Belongs to either category OR subcategory
- Contains pricing configuration
- Optional booking & add-ons

## 🔁 Tax Inheritance Design

Tax is **never duplicated** in items. At runtime:

```
Item Tax → Subcategory Tax → Category Tax
```

This ensures if a category tax is updated, all inherited items reflect the change **automatically** without updating records.

## 🧹 Soft Delete Strategy

No records are deleted from DB:

```javascript
is_active = false
```

If a category is inactive, all its subcategories and items behave as inactive in API responses.

## 💰 Pricing Engine

Each item supports **exactly one** pricing type:

| Type | Description |
|------|-------------|
| `STATIC` | Fixed price |
| `TIERED` | Price based on usage tiers |
| `COMPLIMENTARY` | Always free |
| `DISCOUNTED` | Base price + flat / % discount |
| `DYNAMIC` | Time-based pricing |

## 🔥 Price Calculation API

```
GET /api/v1/items/:id/price
```

**Query Parameters:**
- `quantity` - Number of items (default: 1)
- `datetime` - ISO datetime for dynamic pricing (default: now)
- `addons` - JSON array of selected add-ons

**Response includes:**
- Applied pricing rule
- Base price
- Discount
- Tax amount (with inheritance info)
- Add-ons total
- **Final payable price**

This forces all pricing logic to be calculated **dynamically**.

## 📅 Availability & Booking

- Define available days & time slots
- Book slots with customer info
- Prevent double booking
- Detect overlapping time conflicts

## ➕ Add-ons System

- Add-ons belong to groups
- Optional / Mandatory support
- Add-ons affect final price
- Grouped add-ons supported (choose 1 of N)

## 🔎 List API Capabilities

- ✅ **Pagination** (`page`, `limit`)
- ✅ **Sorting**: name, price, createdAt (`sort=-createdAt,name`)
- ✅ **Filters**: price range, tax applicable, category, active only
- ✅ **Partial text search** (`search`)

## 🛠️ Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Joi** - Validation
- **Service Layer Architecture**

## ▶️ Run Locally

### Prerequisites
- Node.js v18+
- MongoDB running locally or MongoDB Atlas connection string

### Installation

```bash
# Clone repository
git clone <repo-url>
cd guestara-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update MONGODB_URI in .env if needed
# Default: mongodb://localhost:27017/guestara

# Run development server
npm run dev
```

### Available Scripts

```bash
npm run dev     # Start with nodemon (hot reload)
npm start       # Start production server
```

## 📚 API Endpoints

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/categories` | Create category |
| GET | `/api/v1/categories` | Get all categories |
| GET | `/api/v1/categories/:id` | Get category by ID |
| GET | `/api/v1/categories/:id/subcategories` | Get category with subcategories |
| PUT | `/api/v1/categories/:id` | Update category |
| DELETE | `/api/v1/categories/:id` | Soft delete category |
| DELETE | `/api/v1/categories/:id/permanent` | Hard delete category |
| POST | `/api/v1/categories/:id/restore` | Restore category |

### Subcategories
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/subcategories` | Create subcategory |
| GET | `/api/v1/subcategories` | Get all subcategories |
| GET | `/api/v1/subcategories/:id` | Get subcategory by ID |
| GET | `/api/v1/subcategories/:id/tax` | Get subcategory with effective tax |
| GET | `/api/v1/subcategories/:id/items` | Get subcategory with items |
| PUT | `/api/v1/subcategories/:id` | Update subcategory |
| DELETE | `/api/v1/subcategories/:id` | Soft delete subcategory |
| POST | `/api/v1/subcategories/:id/restore` | Restore subcategory |

### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/items` | Create item |
| GET | `/api/v1/items` | Get all items (with filters) |
| GET | `/api/v1/items/search?q=query` | Search items |
| GET | `/api/v1/items/:id` | Get item by ID |
| GET | `/api/v1/items/:id/tax` | Get item with effective tax |
| **GET** | **`/api/v1/items/:id/price`** | **🔥 Calculate dynamic price** |
| PUT | `/api/v1/items/:id` | Update item |
| DELETE | `/api/v1/items/:id` | Soft delete item |
| POST | `/api/v1/items/:id/restore` | Restore item |

### Add-on Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/addon-groups` | Create add-on group |
| GET | `/api/v1/addon-groups` | Get all add-on groups |
| GET | `/api/v1/addon-groups/:id` | Get add-on group by ID |
| PUT | `/api/v1/addon-groups/:id` | Update add-on group |
| DELETE | `/api/v1/addon-groups/:id` | Soft delete add-on group |
| POST | `/api/v1/addon-groups/:id/addons` | Add add-on to group |
| PUT | `/api/v1/addon-groups/:id/addons/:addonId` | Update add-on |
| DELETE | `/api/v1/addon-groups/:id/addons/:addonId` | Remove add-on |
| POST | `/api/v1/addon-groups/:id/calculate-price` | Calculate add-on price |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/bookings` | Create booking |
| GET | `/api/v1/bookings` | Get all bookings |
| GET | `/api/v1/bookings/availability?item=&date=` | Check available slots |
| GET | `/api/v1/bookings/by-date?item=&date=` | Get bookings for date |
| GET | `/api/v1/bookings/customer/:email` | Get customer history |
| GET | `/api/v1/bookings/upcoming/:itemId` | Get upcoming bookings |
| GET | `/api/v1/bookings/:id` | Get booking by ID |
| PUT | `/api/v1/bookings/:id` | Update booking |
| POST | `/api/v1/bookings/:id/cancel` | Cancel booking |
| POST | `/api/v1/bookings/:id/complete` | Complete booking |

## 📝 Example API Usage

### Create Category with Tax
```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Starters",
    "description": "Appetizers and starters",
    "tax_applicable": true,
    "tax_percentage": 5
  }'
```

### Create Item with Dynamic Pricing
```bash
curl -X POST http://localhost:3000/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spa Treatment",
    "category": "CATEGORY_ID",
    "pricing": {
      "type": "DYNAMIC",
      "default_price": 100,
      "dynamic_rules": [
        {
          "name": "Weekend Special",
          "days": [0, 6],
          "start_time": "10:00",
          "end_time": "18:00",
          "price": 150,
          "priority": 1
        },
        {
          "name": "Happy Hour",
          "days": [1, 2, 3, 4, 5],
          "start_time": "14:00",
          "end_time": "17:00",
          "price": 80,
          "priority": 2
        }
      ]
    },
    "is_bookable": true,
    "availability_slots": [
      { "day": 1, "start_time": "09:00", "end_time": "18:00", "max_bookings": 5 }
    ]
  }'
```

### Calculate Price
```bash
curl "http://localhost:3000/api/v1/items/ITEM_ID/price?quantity=2&datetime=2024-01-15T15:00:00Z"
```

## 📚 Reflections

### Why MongoDB?
MongoDB provides **schema flexibility** which is ideal for dynamic pricing configurations and add-on structures.

### Three Things I Learned
1. Designing runtime inheritance systems
2. Building real pricing engines instead of static fields
3. Preventing booking conflicts using overlapping logic

### Hardest Challenge
Implementing dynamic pricing & tier validation without overlapping conflicts.

### What I Would Improve
- Add automated tests (Jest)
- Add Redis caching for pricing API
- Improve booking concurrency handling
- Add API rate limiting
- Implement authentication & authorization

---

**This project demonstrates real backend engineering skills, not just API building.**

## 📄 License

ISC
