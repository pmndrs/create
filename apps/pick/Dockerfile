# Build stage
FROM node:20-slim AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy the entire workspace
COPY . .

# Run the pnpm commands as specified
RUN pnpm -F react-three-create-pick-proxy... install
RUN pnpm -F react-three-create-pick-proxy... build
RUN echo "inject-workspace-packages=true" >> ./.npmrc
RUN pnpm -F react-three-create-pick-proxy... install --no-frozen-lockfile
# Update package.json main fields to point to dist folders
RUN pnpm -F "./packages/*" exec -- npm pkg set main=dist/index.js
RUN pnpm -F react-three-create-pick-proxy deploy --prod ./pruned

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Copy the pruned output from the build stage
COPY --from=builder /app/pruned .

EXPOSE 8080
CMD ["npm", "start"]