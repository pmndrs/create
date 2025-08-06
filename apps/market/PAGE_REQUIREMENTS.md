# pmndrs Market Pages and Requirements

## Core Pages

### 1. Home Page (/) - ✅ Partially Implemented
- **Purpose**: Browse and discover recipes
- **Features**:
  - Recipe cards grid view (✅ implemented)
  - Filtering by name, category, and dependencies (✅ implemented)
  - Filter sidebar (✅ implemented)
  - Search functionality (✅ implemented)
  - Tag filtering (❌ not implemented)

### 2. Recipe Detail Page (/recipe/[name]) - ✅ Partially Implemented
- **Purpose**: View detailed information about a recipe
- **Features**:
  - For Artifacts:
    - Display primary example (if exists) with build output (❌ not implemented)
    - Installation instructions (❌ not implemented)
    - List of other examples (❌ not implemented)
    - List of dependent artifacts (❌ not implemented)
  - For Examples:
    - Full view of the example (❌ not implemented)
    - List of dependent artifacts (❌ not implemented)
    - List of similar examples (❌ not implemented)
  - Version selector (❌ not implemented)
  - Tags display (❌ not implemented)
  - Approval status indicator (❌ not implemented)

### 3. Example Detail Page (/recipe/[name]) - ✅ Partially Implemented
- **Purpose**: View full example details
- **Features**:
  - Full example view (❌ not implemented)
  - Build output display (❌ not implemented)
  - Dependencies list (❌ not implemented)
  - Similar examples list (❌ not implemented)
  - Version information (❌ not implemented)

### 4. User Dashboard (/dashboard) - ✅ Partially Implemented
- **Purpose**: Manage user's recipes and API key
- **Features**:
  - List of user's uploaded recipes (❌ not implemented)
  - Recipe status (approved/pending) (❌ not implemented)
  - API key display and regeneration (❌ not implemented)
  - Upload new recipe button (❌ not implemented)

### 5. Admin Panel (/admin) - ✅ Partially Implemented
- **Purpose**: Approve recipes and manage content
- **Features**:
  - List of unapproved recipes (❌ not implemented)
  - Dependency validation (❌ not implemented)
  - Approve/Reject buttons (❌ not implemented)
  - Build trigger for examples (❌ not implemented)

### 6. Authentication Pages - ✅ Implemented
- Sign In (/auth/signin) - ✅ implemented
- Sign Up (/auth/signup) - ✅ implemented

## API Endpoints

### 1. Recipe Management
- GET /api/recipes - ✅ Implemented
- POST /api/recipes - ❌ Not implemented (for API key upload)
- GET /api/recipes/[id] - ❌ Not implemented
- PUT /api/recipes/[id] - ❌ Not implemented

### 2. Admin APIs
- GET /api/admin/unapproved - ✅ Implemented
- POST /api/recipes/[id]/approve - ✅ Implemented
- POST /api/recipes/[id]/build - ❌ Not implemented

### 3. User APIs
- GET /api/users/api-key - ✅ Implemented
- POST /api/users/api-key/regenerate - ❌ Not implemented

### 4. Tag APIs
- GET /api/tags - ❌ Not implemented
- POST /api/tags - ❌ Not implemented

## Key Requirements Not Yet Implemented

1. **Tag System**:
   - 3-20 character validation
   - Tag filtering on home page
   - Tag management in recipe upload

2. **Example Build System**:
   - Build queue for approved examples
   - Build status tracking
   - Build output storage and display

3. **Dependency Validation**:
   - Prevent approval if dependencies not approved
   - Visual indicator for dependency status

4. **API Upload System**:
   - Recipe upload via API with API key
   - Version management
   - Recipe validation

5. **Primary Example Logic**:
   - Identify primary example (most similar name + same user)
   - Display on artifact page

6. **Similar Examples Algorithm**:
   - Based on name similarity and dependencies

7. **Installation Instructions**:
   - Display for artifacts
   - Format and presentation