# Immich Albums

A beautiful photo and video gallery web application that integrates with Immich to display albums in a polaroid-style grid layout.

## Features

- **Polaroid-style photo grid** with randomized rotations
- **Video support** with play button indicators and full-screen playback
- **Lightbox functionality** with keyboard navigation (arrow keys, escape)
- **Responsive design** with masonry grid layout
- **Direct Immich integration** via API

## Environment Variables

Create a `.env.local` file with the following variables:

```env
IMMICH_URL=https://your-immich-server.com/api
IMMICH_API_KEY=your-immich-api-key
```

## Development

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production Deployment

### Docker (Recommended)

1. **Build the Docker image:**
```bash
docker build -t immich-albums .
```

2. **Run with Docker Compose:**
```bash
docker-compose up -d
```

3. **Or run with Docker directly:**
```bash
docker run -d \
  --name immich-albums \
  -p 3000:3000 \
  -e IMMICH_URL=https://your-immich-server.com/api \
  -e IMMICH_API_KEY=your-immich-api-key \
  immich-albums
```

### Environment Variables for Docker

The Docker setup supports the following environment variables:

- `IMMICH_URL` - Your Immich server API URL
- `IMMICH_API_KEY` - Your Immich API key
- `PORT` - Port to run the application on (default: 3000)

### Manual Deployment

1. **Build the application:**
```bash
npm run build
```

2. **Start the production server:**
```bash
npm start
```

## Configuration

The application uses the following APIs from your Immich server:

- `/albums` - List all albums
- `/albums/{id}` - Get album details and assets
- `/assets/{id}` - Get full-resolution asset
- `/assets/{id}/thumbnail` - Get asset thumbnail

Make sure your Immich API key has read access to these endpoints.

## Browser Support

- Modern browsers with ES6+ support
- Video playback requires HTML5 video support
