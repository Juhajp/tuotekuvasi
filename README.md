# tuotekuvasi.fi

AI-powered product image generator for e-commerce merchants. Upload a garment image and generate professional-looking photos of the garment worn by a model in seconds.

## Features

- 🎨 **AI Image Generation**: Powered by Fal.ai (GPT Image 1.5 Edit, Gemini 2.5 Flash Edit)
- 👔 **Multiple Garment Types**: Support for various clothing items (shirts, dresses, jackets, shoes, etc.)
- 🌍 **Environment Selection**: Professional studio or outdoor winter landscape
- 👤 **Model Gender Selection**: Male or female models
- ⚡ **Async Processing**: Vercel-compatible async architecture with status polling
- 💾 **Supabase Backend**: PostgreSQL database and storage

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js Server Actions, Supabase (PostgreSQL, Storage)
- **AI**: Fal.ai API
- **Deployment**: Vercel

## Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd tuotekuvasi.fi
npm install
```

### 2. Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FAL_KEY=your_fal_api_key
```

### 3. Database Setup

Run the SQL migrations in your Supabase SQL Editor:

1. Create the initial schema:
   ```bash
   # Run supabase/schema.sql
   ```

2. Apply async processing migration:
   ```bash
   # Run supabase/migration_async.sql
   ```

3. Fix storage policies (if needed):
   ```bash
   # Run supabase/fix_policies.sql
   ```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FAL_KEY`
5. Click "Deploy"

### 3. Verify Deployment

The `vercel.json` configuration ensures serverless functions have a 60-second timeout for async processing.

## How It Works

### Async Processing Flow

1. **User uploads image** → Frontend sends to `startGeneration` Server Action
2. **Quick response** → Image uploaded to Supabase, database entry created with `status: 'pending'`, returns `generationId`
3. **Background processing** → `processGenerationAsync` handles Fal.ai API call (can take 30-60s)
4. **Frontend polling** → Polls `getGenerationStatus` every 3 seconds to check status
5. **Result display** → When `status: 'completed'`, shows generated image

### Database Schema

The `generated_images` table tracks:
- `status`: pending → processing → completed/failed
- `original_image_url`: Uploaded garment image
- `generated_image_url`: AI-generated result
- `prompt_settings`: JSONB with model, prompt, garment type, etc.
- `error_message`: Error details if generation fails
- `updated_at`: Last status update timestamp

## Project Structure

```
tuotekuvasi.fi/
├── src/
│   ├── app/
│   │   ├── actions/
│   │   │   └── generate.ts        # Server Actions (startGeneration, getGenerationStatus)
│   │   └── page.tsx                # Main UI
│   ├── components/ui/              # Shadcn/ui components
│   ├── types/
│   │   └── supabase.ts             # TypeScript types for database
│   └── utils/supabase/             # Supabase client utilities
├── supabase/
│   ├── schema.sql                  # Initial database schema
│   ├── migration_async.sql         # Async processing migration
│   └── fix_policies.sql            # Storage RLS policies
├── .env.example                    # Example environment variables
└── vercel.json                     # Vercel configuration
```

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
