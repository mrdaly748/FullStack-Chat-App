import express from 'express';
  import authRoutes from './routes/auth.route.js';
  import dotenv from 'dotenv';
  import cookieParser from 'cookie-parser';
  import messageRoutes from './routes/message.route.js';
  import cors from "cors";
  import {app, server} from './lib/socket.js';
  import path from 'path';
  import { connectDB } from './lib/db.js';

  dotenv.config();

  const PORT = process.env.PORT || 5001;
  const __dirname = path.resolve();

  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    })
  );

  // Log all routes before mounting
  console.log('Routes before mounting:');
  const printRoutes = (stack, prefix = '') => {
    stack.forEach(layer => {
      if (layer.route) {
        Object.keys(layer.route.methods).forEach(method => {
          console.log(`${method.toUpperCase()} ${prefix}${layer.route.path}`);
        });
      } else if (layer.name === 'router' && layer.handle.stack) {
        const routePrefix = layer.regexp.source.replace(/^\^\\\/|\/\?(.*)$/g, '$1');
        printRoutes(layer.handle.stack, prefix + routePrefix);
      }
    });
  };

  try {
    // Log and mount auth routes
    console.log('Auth routes:');
    printRoutes(authRoutes.stack);
    app.use("/api/auth", authRoutes);
    console.log('Auth routes mounted');

    // Log and mount message routes
    console.log('Message routes:');
    printRoutes(messageRoutes.stack);
    app.use("/api/messages", messageRoutes);
    console.log('Message routes mounted');

    if (process.env.NODE_ENV === "production") {
      console.log('Mounting static files');
      app.use(express.static(path.join(__dirname, "../frontend/dist")));
      console.log('Mounting wildcard route');
      app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
      });
      console.log('Production routes mounted');
    }

    // Log all routes after mounting
    console.log('All registered routes:');
    printRoutes(app._router.stack);
  } catch (err) {
    console.error('Error registering routes:', err);
  }

  server.listen(PORT, () => {
    console.log('Server is running on PORT :', PORT);
    connectDB();
  });
