# VEX Tournament Manager Raspberry Pi Remote Display Client

The VEX Tournament Manager Raspberry Pi is a great tool to have pit displays located at any TV in a VEX robotics competition venue. However, it's sometimes not feasible to get an HDMI connection to all the devices, while all the devices may be capable of displaying a full-screen view from a web browser.

The project aims to provide a static web page using ReactJS that can accept the IP address of a VEX TM Raspberry Pi and use the `http://<RPi IP>/screen.png` endpoint to continuously fetch the latest image and display it full-screen in the browser.

## Features

- Simple IP address configuration
- Full viewport display mode (fills the entire browser viewport)
- Browser full-screen mode support with dedicated button
- Automatic screen refresh as fast as possible (Waits for complete image transfer before rendering to prevent partial displays during slow network conditions, then immediately fetches the next image)
- Error handling for connection issues

## Requirements

- Modern web browser (Chrome or Edge recommended) with JavaScript enabled
- Network access to the VEX TM Raspberry Pi
- The browser must be on the same network as the Raspberry Pi

For development:
- Node.js (version 16 or higher recommended)
- npm or yarn package manager

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

## Building for Production

To build the application as a static web page:

```bash
npm run build
```

This will create a `dist` folder containing all the static files ready for deployment.

To preview the production build locally:

```bash
npm run preview
```

## Configuration

The IP address can be provided in two ways:

1. **URL Query Parameter** (recommended for sharing): Add `?ip=<RPi IP>` to the URL
   - Example: `https://your-site.com/?ip=192.168.1.100`
   - When accessed with a query parameter, the application will automatically connect to the specified IP address
   - This is ideal for sharing links with users - they can simply click the link and it will start working immediately

2. **Manual Entry**: When the web page first starts without a query parameter, it asks the user for the IP address of the Raspberry Pi
   - The entered IP address is saved to the browser's local storage for future visits
   - The URL is automatically updated with the query parameter when an IP is entered manually

Once an IP address is provided (via URL or manual entry), the page will attempt to access the `http://<RPi IP>/screen.png` endpoint from the Raspberry Pi:
  * If successful, it displays the PNG in full viewport mode (filling the entire browser viewport) and continuously fetches new images as fast as possible (immediately after each image finishes loading). The application includes a button to enter browser full-screen mode so the PNG will take up the entire screen.
  * If unsuccessful, it reports an error to the user

## Deployment

After building the application with `npm run build`, the `dist` folder contains all static files that can be deployed to any web hosting service.

### AWS S3 Deployment

1. Build the application: `npm run build`
2. Upload the contents of the `dist` folder to an S3 bucket
3. Configure the S3 bucket for static website hosting
4. Set the bucket policy to allow public read access
5. Access the application via the S3 website endpoint

### Other Hosting Options

The static files in the `dist` folder can also be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any web server capable of serving static files