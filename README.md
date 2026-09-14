# ShopEasy Backend

REST API for the ShopEasy Flutter app — MongoDB (Atlas) + Cloudinary
(images) + Nodemailer/Gmail (OTP emails) + JWT auth. Built to run
either as a normal Node server or as Vercel serverless functions.

## 1. Setup

```bash
npm install
cp .env.example .env   # if starting fresh — a filled-in .env is already included
```

Fill in the three placeholders in `.env` (marked `TODO`):

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | Atlas → your cluster → **Connect** → **Drivers** → copy the connection string, drop in the username/password already provided |
| `EMAIL_USER` | The Gmail address the app password (`EMAIL_APP_PASSWORD`) was generated for |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard, top-left, next to your API key |

`JWT_SECRET` and `RESET_TOKEN_SECRET` are already generated for you — safe to keep, or swap for your own random strings.

## 2. Run locally

```bash
npm run dev      # nodemon, auto-restarts on changes
# or
npm start
```

Health check: `GET http://localhost:5000/api/health`

## 3. Seed sample data

Populates the same categories/products already mocked in the Flutter app's `CategoryService`/`ProductService`:

```bash
npm run seed
```

## 4. Create your first admin

There's no public "become admin" endpoint on purpose. Register a normal account from the app or via `POST /api/auth/register`, then run:

```bash
node utils/makeAdmin.js you@example.com
```

## 5. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Then in the Vercel dashboard → Project → Settings → Environment Variables, paste in every value from your `.env` (Vercel doesn't read `.env` files at runtime — env vars must be set in the dashboard or via `vercel env add`). Redeploy after adding them.

`vercel.json` routes every request to `api/index.js`, which exports the same Express `app` used locally — no code differences between environments.

## 6. Point the Flutter app at this API

In `lib/core/network/api_endpoints.dart`, set:

```dart
static const String baseUrl = 'https://your-project.vercel.app/api';
```

(or `http://localhost:5000/api` for local testing against an emulator — use `http://10.0.2.2:5000/api` specifically for the Android emulator).

Then in `lib/core/network/api_client.dart`, implement the real HTTP calls (the TODO comments already sketch the shape). Every service in `lib/services/` (`AuthService`, `ProductService`, etc.) already returns the right model types — only the *body* of each method needs to change from a mocked `Future.delayed` to a real `ApiClient` call. No screen or widget code needs to change.

---

## API Reference

All responses are JSON: `{ success: bool, message?: string, data?: ..., pagination?: ... }`.
Authenticated routes expect `Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/register` | `fullName, email, password` | Matches `AuthService.register` |
| POST | `/login` | `email, password` | Not yet in `AuthService` — add it |
| POST | `/forgot-password` | `email` | Sends 6-digit OTP email |
| POST | `/verify-reset-code` | `email, code` | Returns `resetToken` |
| POST | `/reset-password` | `email, resetToken, newPassword` | |
| POST | `/google` | `idToken` | Needs `GOOGLE_CLIENT_ID` set |
| POST | `/microsoft` | `accessToken` | Validated via Microsoft Graph, no extra secret needed |

### Users — `/api/users` (auth required)
| Method | Path | Body |
|---|---|---|
| GET | `/me` | |
| PUT | `/me` | `fullName, email, phone` |
| PUT | `/me/password` | `currentPassword, newPassword` |
| GET | `/me/addresses` | |
| POST | `/me/addresses` | `label, fullName, phone, street, city, state, country, postalCode, isDefault` |
| PUT | `/me/addresses/:addressId` | any of the above fields |
| DELETE | `/me/addresses/:addressId` | |

### Categories — `/api/categories`
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/` | public | |
| POST | `/` | admin | multipart: `name, icon, sortOrder, image` |
| PUT | `/:id` | admin | multipart, all fields optional |
| DELETE | `/:id` | admin | |

### Products — `/api/products`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/?category=&search=&sort=&page=&limit=` | public | `sort`: `price-asc\|price-desc\|newest\|rating` |
| GET | `/best-sellers?limit=` | public | |
| GET | `/:id` | public | |
| POST | `/` | admin | multipart: `name, description, price, discountPrice, category, stock, sku, isBestSeller, images[]` (up to 5) |
| PUT | `/:id` | admin | multipart, all fields optional, `removeImageIds` = comma-separated Cloudinary public IDs to delete |
| DELETE | `/:id` | admin | |

### Cart — `/api/cart` (auth required)
| Method | Path | Body |
|---|---|---|
| GET | `/` | |
| POST | `/items` | `productId, quantity` |
| PUT | `/items/:productId` | `quantity` |
| DELETE | `/items/:productId` | |
| DELETE | `/` | clears the cart |

### Wishlist — `/api/wishlist` (auth required)
| Method | Path |
|---|---|
| GET | `/` |
| POST | `/:productId` |
| DELETE | `/:productId` |

### Payment Methods — `/api/payment-methods` (auth required)
Metadata only — **never** stores a full card number or CVV. Wire a real gateway (Stripe/Paymob) on the client and pass its token as `gatewayToken` when ready.

| Method | Path | Body |
|---|---|---|
| GET | `/` | |
| POST | `/` | `brand, last4, expiry, isDefault, gatewayToken?` |
| PUT | `/:id/default` | |
| DELETE | `/:id` | |

### Orders — `/api/orders` (auth required)
| Method | Path | Body |
|---|---|---|
| POST | `/` | `addressId` **or** `shippingAddress`, `paymentMethodId?` — checks out the current cart |
| GET | `/` | order history |
| GET | `/:id` | |

### Admin — `/api/admin` (admin only)
| Method | Path | Notes |
|---|---|---|
| GET | `/dashboard/stats` | feeds `statistic_card.dart` |
| GET | `/dashboard/sales-chart?range=week\|month\|year` | feeds `sales_chart.dart` |
| GET | `/dashboard/recent-orders?limit=` | feeds `recent_orders.dart` |
| GET | `/users?search=&page=&limit=` | |
| GET | `/users/:id` | |
| PUT | `/users/:id` | `role, isBlocked, fullName, phone` |
| DELETE | `/users/:id` | |
| GET | `/orders?status=&page=&limit=` | |
| GET | `/orders/:id` | |
| PUT | `/orders/:id/status` | `status: processing\|shipped\|delivered\|cancelled` |

Product/category create/update/delete also live under admin control, mounted at `/api/products` and `/api/categories` (see above) rather than duplicated under `/api/admin` — same `adminOnly` gate either way.

## Security notes
- Passwords hashed with bcrypt, never stored or returned in plaintext.
- Payment methods store only brand/last4/expiry — no PAN, no CVV.
- Reset tokens are signed with a **separate** secret from login tokens, so a leaked reset token can't be replayed as a session token.
- OTPs are hashed (SHA-256) before being stored, and expire after 10 minutes.
- `forgotPassword` always returns a generic success message, even for unregistered emails, to avoid leaking which addresses have accounts.
