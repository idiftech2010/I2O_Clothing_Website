# I²O CLOTHING Website

## Local Setup

1. Open PowerShell or Command Prompt.
2. Navigate to the backend folder:
   ```powershell
   cd "c:\Users\USER\Documents\Everything Idrees\I2O_Clothing_Website\backend"
   ```
3. Install backend dependencies:
   ```powershell
   npm install
   ```
4. Start the server:
   ```powershell
   node server.js
   ```
5. Open the website in your browser:
   ```text
   http://localhost:3000
   ```

## Logo

- The site currently uses `frontend/images/logo.svg` as the logo.
- To use your attached logo image, replace `frontend/images/logo.svg` with your exported logo file, or save it as `frontend/images/logo.png` and update the HTML to use that path.

## Product Management

The project includes an admin dashboard at `frontend/admin.html` that allows you to create, edit, update, and delete products without calling the API manually.

### Default admin account

- Email: `admin@i2oclothing.com`
- Password: `Admin123!`

If the Stripe or SQLite database was already created with the old admin email, delete `backend/i2o_clothing.db` and restart the server so the corrected admin account can be created.

### Create a new product

1. Open `http://localhost:3000/admin.html` in your browser.
2. Fill in the product form:
   - Product Name
   - Category
   - Price (in Naira)
   - Stock quantity
   - Image URL
   - Sizes/Options (comma-separated values, e.g. `S, M, L`)
   - Description
3. Click **Create Product**.

> You can use an online image URL or a local image path such as `images/your-image.jpg` if the image file is placed inside `frontend/images/`.

### Edit or update a product

1. On the admin dashboard, click **Edit** next to the product.
2. The form will populate with the product's values.
3. Change any field, including the image URL or stock level.
4. Click **Update Product**.

### Delete a product

1. On the admin dashboard, click **Delete** next to the product.
2. Confirm the deletion.
3. The product is removed from the store immediately.

### Add pictures to the homepage carousel

The homepage carousel shows featured products from the active product list. To add images to the carousel:

1. Create a new product with an `image_url` value.
2. Ensure the product has `stock` greater than `0`, because the carousel excludes out-of-stock items.
3. Save the product.
4. Go to the homepage and refresh the page.

If you want the carousel to display local images stored in the project, place the image file in `frontend/images/` and use a relative URL like:

```text
images/your-carousel-image.jpg
```
### How to link images to products or add pictures

There are two ways to add images to products: using online URLs or local images.

#### Using online image URLs

1. Find an image online (e.g., from Unsplash, your website, or stock photo sites).
2. Copy the direct link to the image (right-click > Copy Image Address).
3. In the admin dashboard, paste the URL into the "Image URL" field when creating or editing a product.
4. Example: `https://source.unsplash.com/featured/?gold,cufflinks,accessory`

#### Using local images

1. Save your image file to the `frontend/images/` folder.
   - Supported formats: JPG, PNG, GIF, WebP, SVG.
   - Recommended size: 500x500 pixels or larger for good quality.
   - File naming: Use descriptive names like `luxury-cufflinks.jpg`.

2. In the admin dashboard, enter the relative path in the "Image URL" field:
   - Example: `images/luxury-cufflinks.jpg`
   - Do not include the full path like `c:\Users\...\images\...` – just `images/filename.jpg`.

3. Save the product. The image will now display in the shop, product details, and carousel.

#### Tips for images

- **File size**: Keep images under 500KB for faster loading.
- **Aspect ratio**: Square images (1:1) work best for product cards.
- **Alt text**: The product name is used as alt text automatically.
- **Multiple images**: Currently, each product has one image. For multiple images, you would need to modify the database schema.
- **Logo**: The site logo is `frontend/images/logo.png`. If you replace it, ensure the new file is named `logo.png`.

If images don't load, check:
- The file path is correct (case-sensitive on some servers).
- The image file exists in `frontend/images/`.
- For online URLs, ensure the link is direct to the image file, not a webpage.
### Direct API usage

If you prefer the API instead of the admin dashboard, use these endpoints:

- `POST /api/products` — create a new product
- `PUT /api/products/:id` — update an existing product
- `DELETE /api/products/:id` — delete a product

Example JSON body for creating or updating a product:

```json
{
  "name": "Luxury Gold Cufflinks",
  "category": "Accessories",
  "price": 25000,
  "description": "Elegant 18k gold-plated cufflinks.",
  "image_url": "https://source.unsplash.com/featured/?gold,cufflinks,accessory",
  "sizes": ["One Size"],
  "stock": 10
}
```

## Database Notes

- The backend uses SQLite in `backend/i2o_clothing.db`.
- Product images are stored as URLs in the `products.image_url` column.
- If you want to add local images, place them in `frontend/images/` and use the relative URL `images/your-image.jpg`.

## Payment Options

The checkout form includes the following payment methods:

- **Card Payment**: Accepts Visa, Mastercard, and Verve cards. (UI only - requires payment gateway integration)
- **Bank Transfer**: Direct bank transfer. (UI only - requires bank API integration)
- **Paystack**: Nigerian payment processor. (UI only - requires Paystack API integration)

Currently, these are UI placeholders. To fully integrate:

1. For Paystack: Sign up at [paystack.com](https://paystack.com), get API keys, and integrate their SDK.
2. For card payments: Use Stripe or Flutterwave for Nigerian payments.
3. For bank transfers: Implement bank API or provide account details.

Orders are saved with the selected payment method for processing.
