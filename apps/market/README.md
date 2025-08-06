# pmndrs Market

A marketplace for pmndrs recipes built with Next.js, Prisma, and Neon PostgreSQL.

## Features

- **Recipe Management**: Upload and manage artifact and example recipes
- **Admin Approval System**: Comprehensive approval workflow with dependency validation
- **API Access**: Programmatic recipe uploads via API keys
- **Tag System**: Organize recipes with searchable tags
- **Version Control**: Multiple versions per recipe with approval tracking
- **Build System**: Track build status for example recipes
- **Filtering**: Advanced filtering by name, category, type, dependencies, and tags

## Tech Stack

- **Frontend**: Next.js 15.4.5, React 19, TypeScript
- **UI**: shadcn/ui components, Tailwind CSS
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with email/password
- **Styling**: Tailwind CSS with CSS custom properties

## Setup

### 1. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update the variables in `.env`:

```env
# Database - Neon PostgreSQL
DATABASE_URL="postgresql://username:password@ep-xyz.us-east-1.aws.neon.tech/pmndrs_market?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Optional: Direct connection for connection pooling
DIRECT_URL="postgresql://username:password@ep-xyz.us-east-1.aws.neon.tech/pmndrs_market?sslmode=require"
```

### 2. Neon Database Setup

1. Create a new project at [Neon Console](https://console.neon.tech)
2. Copy your connection string from the Neon dashboard
3. Update `DATABASE_URL` in your `.env` file
4. For connection pooling, use the pooled connection string for `DATABASE_URL` and direct connection for `DIRECT_URL`

### 3. Database Migration

Run Prisma migrations to set up your database:

```bash
npm run db:generate
npm run db:push
```

Or if you want to use proper migrations:

```bash
npm run db:migrate
```

### 4. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 5. Seed Database (Optional)

Add some sample data to get started:

```bash
npm run db:seed
```

This will create:
- Admin user (`admin@pmndrs.market`)
- Test user (`user@pmndrs.market`) 
- Sample artifact and example recipes
- Tags and dependencies

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

> **Note**: All database scripts now automatically load environment variables using `@dotenvx`

## Database Schema

The application uses the following main models:

- **User**: Authentication and API key management
- **Recipe**: Core recipe data (artifacts and examples)
- **RecipeVersion**: Version control for recipes
- **Tag**: Tagging system for organization
- **RecipeDependency**: Dependency relationships between recipes

## API Endpoints

### Public Endpoints
- `GET /api/recipes` - Browse approved recipes
- `GET /api/recipes/[id]` - Get recipe details
- `GET /api/tags` - Get all tags

### Authenticated Endpoints
- `POST /api/recipes` - Upload recipe (requires API key)
- `GET /api/users/api-key` - Get user's API key
- `POST /api/users/api-key/regenerate` - Regenerate API key

### Admin Endpoints
- `GET /api/admin/unapproved` - List unapproved recipes
- `POST /api/recipes/[id]/approve` - Approve recipe

## Usage

### For Users

1. **Sign Up**: Create an account at `/auth/signup`
2. **Get API Key**: Visit `/dashboard` to get your API key
3. **Upload Recipes**: Use the API to upload recipes programmatically

### For Admins

1. **Admin Panel**: Access `/admin` to review and approve recipes
2. **Dependency Validation**: Recipes can only be approved if all dependencies are approved
3. **Build Management**: Track example build status and outputs

### API Usage Example

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "name": "my-component",
    "category": "components",
    "type": "ARTIFACT",
    "version": "1.0.0",
    "edits": {},
    "tags": ["react", "component"]
  }'
```

## Development

### Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   └── ui/             # shadcn/ui components
├── lib/                # Utility libraries
├── types/              # TypeScript type definitions
└── prisma/             # Database schema and migrations
```

### Key Components

- `RecipeBrowser`: Main recipe listing with filtering
- `RecipeDetail`: Detailed recipe view with examples
- `AdminPanel`: Admin approval interface
- `UserDashboard`: User recipe management and API keys

### Database Operations

The application uses Prisma for all database operations with optimizations for Neon:

- Connection pooling support
- Efficient query patterns  
- Proper indexing for performance
- Automatic environment variable loading with `@dotenvx`

### Available Database Scripts

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes to database
npm run db:migrate     # Create and run migrations
npm run db:reset       # Reset database and run migrations
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with sample data
```

All scripts automatically load your `.env` file using `@dotenvx`.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set all required environment variables:

- `DATABASE_URL`: Your Neon connection string
- `DIRECT_URL`: Direct connection for migrations (optional)
- `BETTER_AUTH_SECRET`: Random secret for auth
- `BETTER_AUTH_URL`: Your production URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details